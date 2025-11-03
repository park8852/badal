"use client"

import type React from "react"
import { useMemo, useState, useEffect, useRef } from "react"
import { memberService } from "@/lib/member-service"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { getAuthInfo, clearAuthInfo } from "@/lib/auth-utils"
import { LogOut, LogIn } from "lucide-react"

// Utilities --------------------------------------------------------------
const pad = (n: number) => String(n).padStart(2, "0")
const isSameDay = (a: Date | null, b: Date | null) =>
  a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const addMonths = (d: Date, m: number) => new Date(d.getFullYear(), d.getMonth() + m, 1)

function getMonthGrid(year: number, month: number, weekStartsOn = 0 /* 0=Sun, 1=Mon */) {
  const first = new Date(year, month, 1)
  const firstDay = first.getDay() // 0-6 (Sun-Sat)
  // offset to the previous weekStartsOn
  const offset = (firstDay - weekStartsOn + 7) % 7
  const start = new Date(year, month, 1 - offset)
  const cells = []
  for (let i = 0; i < 42; i++) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    cells.push(date)
  }
  return cells // 6 weeks * 7 days
}

// Modal Component --------------------------------------------------------
function Modal({
  open,
  onClose,
  children,
  title = "",
}: { open: boolean; onClose: () => void; children: React.ReactNode; title?: string }) {
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose?.()
    }
    if (open) document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      ref={backdropRef}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === backdropRef.current) onClose?.()
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

// Calendar (DOB) ---------------------------------------------------------
function DobCalendar({
  value,
  onChange,
  maxDate,
}: { value: Date | null; onChange: (date: Date) => void; maxDate: Date }) {
  const today = startOfDay(maxDate ?? new Date())
  const [view, setView] = useState(() =>
    value ? new Date(value.getFullYear(), value.getMonth(), 1) : new Date(today.getFullYear(), today.getMonth(), 1),
  )

  // Year options for DOB (default last 120 years)
  const years = useMemo(() => {
    const list = []
    const end = today.getFullYear()
    const start = end - 120 // 120 years back
    for (let y = end; y >= start; y--) list.push(y)
    return list
  }, [today])

  const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"]

  const grid = getMonthGrid(view.getFullYear(), view.getMonth(), 0)

  function prevMonth() {
    setView((d) => addMonths(d, -1))
  }
  function nextMonth() {
    setView((d) => addMonths(d, 1))
  }

  // Disable future days
  const isDisabled = (d: Date) => d > today

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="rounded-lg border px-2 py-1 text-sm hover:bg-gray-50"
            aria-label="Previous month"
          >
            ←
          </button>
          <button
            onClick={nextMonth}
            className="rounded-lg border px-2 py-1 text-sm hover:bg-gray-50"
            aria-label="Next month"
          >
            →
          </button>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="rounded-lg border px-3 py-1.5 text-sm"
            value={view.getFullYear()}
            onChange={(e) => setView(new Date(Number(e.target.value), view.getMonth(), 1))}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border px-3 py-1.5 text-sm"
            value={view.getMonth()}
            onChange={(e) => setView(new Date(view.getFullYear(), Number(e.target.value), 1))}
          >
            {months.map((m, idx) => (
              <option key={m} value={idx}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500">
        {"Sun Mon Tue Wed Thu Fri Sat".split(" ").map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {grid.map((d, i) => {
          const inCurrentMonth = d.getMonth() === view.getMonth()
          const selected = isSameDay(d, value)
          const disabled = isDisabled(d)
          const base = "w-full select-none rounded-xl py-2 text-sm"
          const tone = selected
            ? "bg-black text-white"
            : disabled
              ? "text-gray-300"
              : inCurrentMonth
                ? "text-gray-900 hover:bg-gray-100"
                : "text-gray-400 hover:bg-gray-50"

          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => onChange?.(new Date(d.getFullYear(), d.getMonth(), d.getDate()))}
              className={`${base} ${tone}`}
              aria-pressed={selected}
              aria-label={`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`}
              title={`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`}
            >
              {d.getDate()}
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 text-sm">
        <div className="text-gray-500">
          오늘: {today.getFullYear()}-{pad(today.getMonth() + 1)}-{pad(today.getDate())}
        </div>
        {value && (
          <div className="font-medium">
            선택: {value.getFullYear()}-{pad(value.getMonth() + 1)}-{pad(value.getDate())}
          </div>
        )}
      </div>
    </div>
  )
}

// Public Modal Wrapper ---------------------------------------------------
function DobCalendarModal({
  open,
  onClose,
  value,
  onChange,
}: { open: boolean; onClose: () => void; value: Date | null; onChange: (date: Date) => void }) {
  const maxDate = new Date()

  return (
    <Modal open={open} onClose={onClose} title="생년월일 선택">
      <DobCalendar
        value={value}
        onChange={(d) => {
          onChange?.(d)
          onClose?.()
        }}
        maxDate={maxDate}
      />
    </Modal>
  )
}

interface FormData {
  userid: string
  userpw: string
  name: string
  birth: string
  phone: string
  email: string
  address: string
  role: "USER" | "OWNER"
}

export default function MemberRegisterPage() {
    const router = useRouter()
  const [authInfo, setAuthInfo] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)
  const [form, setForm] = useState<FormData>({
    userid: "",
    userpw: "",
    name: "",
    birth: "",
    phone: "",
    email: "",
    address: "",
    role: "USER",
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ type: string; message: string; data?: any } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPw, setShowPw] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // 클라이언트 사이드에서만 authInfo 로드
  useEffect(() => {
    setIsClient(true)
    setAuthInfo(getAuthInfo())
  }, [])

  // 로그아웃 핸들러
  const handleLogout = () => {
    clearAuthInfo()
    router.push("/login")
  }

  const roles = [
    { value: "USER", label: "일반 사용자", desc: "주문과 리뷰를 이용해요." },
    { value: "OWNER", label: "가게 사장", desc: "가게 등록과 관리 기능." },
  ]

  function validate(values: FormData) {
    const e: Record<string, string> = {}
    if (!values.userid.trim()) e.userid = "아이디를 입력해주세요."
    else if (values.userid.length < 3) e.userid = "아이디는 3자 이상."
    else if (!/^[a-zA-Z0-9]+$/.test(values.userid)) e.userid = "영문/숫자만 가능"

    if (!values.userpw) e.userpw = "비밀번호를 입력해주세요."
    else if (values.userpw.length < 6) e.userpw = "비밀번호는 6자 이상."

    if (!values.name.trim()) e.name = "이름을 입력해주세요."
    else if (values.name.length < 2) e.name = "이름은 2자 이상."

    if (!values.birth) e.birth = "생년월일을 입력해주세요."
    else {
      const birthDate = new Date(values.birth)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const m = today.getMonth() - birthDate.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
      if (isNaN(age) || age < 14 || age > 100) e.birth = "올바른 생년월일인지 확인해주세요."
    }

    if (!values.phone.trim()) e.phone = "전화번호를 입력해주세요."
    else {
      const phoneClean = values.phone.replace(/[-\s]/g, "")
      if (!/^01[016789][0-9]{7,8}$/.test(phoneClean)) e.phone = "전화번호 형식이 올바르지 않습니다."
    }

    if (!values.email.trim()) e.email = "이메일을 입력해주세요."
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) e.email = "이메일 형식이 올바르지 않습니다."

    if (!values.address.trim()) e.address = "주소를 입력해주세요."

    return e
  }

  const passwordScore = useMemo(() => {
    const v = form.userpw || ""
    let score = 0
    if (v.length >= 6) score++
    if (/[A-Z]/.test(v)) score++
    if (/[a-z]/.test(v)) score++
    if (/[0-9]/.test(v)) score++
    if (/[^A-Za-z0-9]/.test(v)) score++
    return Math.min(score, 5)
  }, [form.userpw])

  const ageText = useMemo(() => {
    if (!form.birth) return "—"
    const birthDate = new Date(form.birth)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
    return isNaN(age) ? "—" : `${age}세`
  }, [form.birth])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name === "phone") {
      const digits = value.replace(/\D/g, "")
      let formatted = digits
      if (digits.length > 3 && digits.length <= 7) formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`
      else if (digits.length > 7) formatted = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`
      setForm((prev) => ({ ...prev, [name]: formatted }))
      return
    }

    if (name === "email") {
      // 간단한 자동완성 힌트 (도메인 제안)
      const suggestion = ["gmail.com", "naver.com", "daum.net", "kakao.com"]
      setEmailHints(
        suggestion
          .filter((d) => value.includes("@") && !value.endsWith("@") && d.startsWith(value.split("@")[1] || ""))
          .slice(0, 3),
      )
    }

    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleDateSelect = (date: Date) => {
    const formattedDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    setForm((prev) => ({ ...prev, birth: formattedDate }))
    setSelectedDate(date)
    setShowCalendar(false)
  }

  const openCalendar = () => {
    if (form.birth) {
      const [year, month, day] = form.birth.split("-").map(Number)
      setSelectedDate(new Date(year, month - 1, day))
    }
    setShowCalendar(true)
  }

  const [emailHints, setEmailHints] = useState<string[]>([])

  const applyEmailHint = (domain: string) => {
    const [id] = form.email.split("@")
    setForm((prev) => ({ ...prev, email: `${id}@${domain}` }))
    setEmailHints([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const v = validate(form)
    setErrors(v)
    if (Object.keys(v).length > 0) return

    setLoading(true)
    setResult(null)

    // 요청 데이터 준비
    const requestData = {
      userid: form.userid,
      userpw: form.userpw,
      name: form.name,
      birth: form.birth,
      phone: form.phone,
      email: form.email,
      address: form.address,
      role: form.role,
      created_at: new Date().toISOString().split("T")[0] + " " + new Date().toTimeString().split(" ")[0],
    }

    try {
      const data = await memberService.register(requestData)
      
      // 서버 응답 확인
      if (data.responseType === "SUCCESS") {
        setResult({
          type: "SUCCESS",
          message: data.message || "회원가입이 완료되었습니다.",
          data: data.data,
        })
        // 회원가입 성공 후 로그인 페이지로 이동
        setTimeout(() => {
          router.push("/login")
        }, 1500)
      } else if (data.responseType === "ERROR") {
        // 서버 에러 응답 처리
        const serverErrors: Record<string, string> = {}
        
        // 아이디 중복 에러 처리
        if (data.message?.includes("이미 존재하는 아이디")) {
          serverErrors.userid = data.message
        }
        // 이메일 중복 에러 처리
        else if (data.message?.includes("이미 존재하는 이메일")) {
          serverErrors.email = data.message
        }
        // 전화번호 중복 에러 처리
        else if (data.message?.includes("이미 존재하는 전화번호")) {
          serverErrors.phone = data.message
        }
        // 기타 에러
        else {
          setResult({
            type: "ERROR",
            message: data.message || "회원가입 중 오류가 발생했습니다.",
          })
        }
        
        setErrors(serverErrors)
      }
    } catch (err: any) {
      setResult({
        type: "FAIL",
        message: err.message || "네트워크 오류가 발생했습니다.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setForm({ userid: "", userpw: "", name: "", birth: "", phone: "", email: "", address: "", role: "USER" })
    setErrors({})
    setResult(null)
    setEmailHints([])
    setSelectedDate(null)
    setShowCalendar(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Top bar */}
      <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/90 border-b">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          {/* 로고 - 홈으로 리다이렉션 */}
          <div className="flex items-center">
            <button 
              onClick={() => router.push("/")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Image 
                src="/logo_black.png" 
                alt="바로배달 로고" 
                width={120} 
                height={30}
                className="object-contain"
              />
            </button>
          </div>
          
          {/* 로그인/로그아웃 버튼 */}
          <div className="flex items-center">
            {isClient && authInfo ? (
              <Button
                variant="outline"
                onClick={handleLogout}
                className="px-6 flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                로그아웃
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => router.push("/login")}
                className="px-6 flex items-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                로그인
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* form */}
          <section className="md:col-span-2">
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              <div className="border-b px-6 py-4">
                <h2 className="font-semibold">기본 정보</h2>
                <p className="text-sm text-slate-500">아이디/비밀번호, 개인정보를 정확히 입력해주세요.</p>
              </div>

              {result && (
                <div
                  className={`mx-6 mt-6 rounded-xl border p-4 ${
                    result.type === "SUCCESS" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                  }`}
                >
                  <p className="font-medium">
                    {result.type === "SUCCESS" ? "성공" : "실패"} : {result.message}
                  </p>
                  {result?.data && (
                    <div className="text-sm text-slate-600 mt-2 space-y-1">
                      {result.data.userId && <p>userId: {result.data.userId}</p>}
                      {result.data.role && <p>role: {result.data.role}</p>}
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} className="px-6 py-6 space-y-8">
                {/* userid + pw */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center justify-between text-sm font-medium mb-2">
                      <span>아이디 *</span>
                      {errors.userid && <span className="text-red-500">{errors.userid}</span>}
                    </label>
                    <input
                      name="userid"
                      value={form.userid}
                      onChange={handleChange}
                      placeholder="영문/숫자 3자 이상"
                      aria-invalid={!!errors.userid}
                      className={`w-full rounded-xl border px-3 py-2.5 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400 ${
                        errors.userid ? "border-red-400" : "border-slate-300"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-sm font-medium mb-2">
                      <span>비밀번호 *</span>
                      {errors.userpw && <span className="text-red-500">{errors.userpw}</span>}
                    </label>
                    <div className="relative">
                      <input
                        type={showPw ? "text" : "password"}
                        name="userpw"
                        value={form.userpw}
                        onChange={handleChange}
                        placeholder="6자 이상 (영문/숫자/특수문자 조합 권장)"
                        aria-invalid={!!errors.userpw}
                        className={`w-full rounded-xl border px-3 py-2.5 pr-10 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400 ${
                          errors.userpw ? "border-red-400" : "border-slate-300"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((s) => !s)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-sm"
                        aria-label={showPw ? "비밀번호 숨기기" : "비밀번호 보기"}
                      >
                        {showPw ? "숨김" : "보기"}
                      </button>
                    </div>

                    {/* strength meter */}
                    <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          passwordScore <= 1
                            ? "bg-red-400 w-1/5"
                            : passwordScore === 2
                              ? "bg-orange-400 w-2/5"
                              : passwordScore === 3
                                ? "bg-amber-400 w-3/5"
                                : passwordScore === 4
                                  ? "bg-lime-500 w-4/5"
                                  : "bg-green-500 w-full"
                        }`}
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      보안 팁: 대/소문자, 숫자, 특수문자를 섞으면 더 안전합니다.
                    </p>
                  </div>
                </div>

                {/* name + birth */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center justify-between text-sm font-medium mb-2">
                      <span>이름 *</span>
                      {errors.name && <span className="text-red-500">{errors.name}</span>}
                    </label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="홍길동"
                      aria-invalid={!!errors.name}
                      className={`w-full rounded-xl border px-3 py-2.5 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400 ${
                        errors.name ? "border-red-400" : "border-slate-300"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-sm font-medium mb-2">
                      <span>생년월일 *</span>
                      {errors.birth && <span className="text-red-500">{errors.birth}</span>}
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          name="birth"
                          value={form.birth}
                          onChange={handleChange}
                          onClick={openCalendar}
                          placeholder="YYYY-MM-DD"
                          readOnly
                          aria-invalid={!!errors.birth}
                          className={`w-full rounded-xl border px-3 py-2.5 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 cursor-pointer placeholder:text-slate-400 ${
                            errors.birth ? "border-red-400" : "border-slate-300"
                          }`}
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </div>
                      <span className="shrink-0 self-center text-xs text-slate-500 w-12 text-right">{ageText}</span>
                    </div>
                  </div>
                </div>

                {/* phone + email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center justify-between text-sm font-medium mb-2">
                      <span>전화번호 *</span>
                      {errors.phone && <span className="text-red-500">{errors.phone}</span>}
                    </label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="010-1234-5678"
                      inputMode="numeric"
                      aria-invalid={!!errors.phone}
                      className={`w-full rounded-xl border px-3 py-2.5 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400 ${
                        errors.phone ? "border-red-400" : "border-slate-300"
                      }`}
                    />
                    <p className="mt-1 text-xs text-slate-500">숫자만 입력해도 자동으로 하이픈이 들어가요.</p>
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-sm font-medium mb-2">
                      <span>이메일 *</span>
                      {errors.email && <span className="text-red-500">{errors.email}</span>}
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="example@email.com"
                        aria-invalid={!!errors.email}
                        className={`w-full rounded-xl border px-3 py-2.5 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400 ${
                          errors.email ? "border-red-400" : "border-slate-300"
                        }`}
                      />
                      {emailHints.length > 0 && (
                        <div className="absolute left-0 right-0 mt-1 rounded-xl border border-slate-200 bg-white shadow z-10">
                          {emailHints.map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => applyEmailHint(d)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                            >
                              {form.email.split("@")[0]}@{d}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* address */}
                <div>
                  <label className="flex items-center justify-between text-sm font-medium mb-2">
                    <span>주소 *</span>
                    {errors.address && <span className="text-red-500">{errors.address}</span>}
                  </label>
                  <input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="서울특별시 중구 …"
                    aria-invalid={!!errors.address}
                    className={`w-full rounded-xl border px-3 py-2.5 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400 ${
                      errors.address ? "border-red-400" : "border-slate-300"
                    }`}
                  />
                </div>

                {/* role cards */}
                <div>
                  <label className="text-sm font-medium">회원 유형 *</label>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {roles.map((r) => (
                      <button
                        type="button"
                        key={r.value}
                        onClick={() => setForm((p) => ({ ...p, role: r.value }))}
                        className={`flex items-start justify-between rounded-2xl border p-4 text-left transition ${
                          form.role === r.value ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:bg-slate-50"
                        }`}
                        aria-pressed={form.role === r.value}
                        aria-label={r.label}
                      >
                        <div>
                          <div className="font-medium">{r.label}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{r.desc}</div>
                        </div>
                        <div
                          className={`h-5 w-5 rounded-full border ${form.role === r.value ? "bg-blue-600 border-blue-600" : "border-slate-300"}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* actions */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    {loading && (
                      <svg
                        className="h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    )}
                    {loading ? "가입 중…" : "회원가입"}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-700 hover:bg-slate-50"
                  >
                    초기화
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* preview */}
          <aside className="md:col-span-1">
            <div className="sticky top-20">
              <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b flex items-center justify-between">
                  <h3 className="font-semibold">미리보기</h3>
                  <span className="text-xs text-slate-500">역할: {form.role}</span>
                </div>
                <div className="p-5">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-lg font-semibold">{form.name || "이름"}</h4>
                        <p className="text-sm text-slate-500 mt-0.5">@{form.userid || "userid"}</p>
                      </div>
                      <div className="text-xs rounded-full bg-emerald-50 text-emerald-700 px-2 py-1">NEW</div>
                    </div>
                    <div className="mt-4 space-y-2 text-sm">
                      <p className="flex gap-2">
                        <span className="shrink-0 text-slate-500">🎂</span>
                        <span className="text-slate-700">
                          {form.birth || "생년월일"} ({ageText})
                        </span>
                      </p>
                      <p className="flex gap-2">
                        <span className="shrink-0 text-slate-500">📞</span>
                        <span className="text-slate-700">{form.phone || "010-0000-0000"}</span>
                      </p>
                      <p className="flex gap-2">
                        <span className="shrink-0 text-slate-500">✉️</span>
                        <span className="text-slate-700">{form.email || "example@email.com"}</span>
                      </p>
                      <p className="flex gap-2">
                        <span className="shrink-0 text-slate-500">📍</span>
                        <span className="text-slate-700">{form.address || "주소"}</span>
                      </p>
                    </div>
                  </div>

                  

                  {!result && (
                    <p className="mt-4 text-xs text-slate-500">제출 전에 우측 카드로 입력 내용을 점검하세요.</p>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* 달력 모달 */}
      <DobCalendarModal
        open={showCalendar}
        onClose={() => setShowCalendar(false)}
        value={selectedDate}
        onChange={handleDateSelect}
      />
    </div>
  )
}
