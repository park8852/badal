import { Clock, CheckCircle, XCircle } from "lucide-react"
import { useBusinessStatus } from "@/hooks/use-business-status"

interface BusinessStatusDisplayProps {
  className?: string
  showTime?: boolean
}

export function BusinessStatusDisplay({ 
  className = "", 
  showTime = true 
}: BusinessStatusDisplayProps) {
  const { isOpen, statusText, openTime, closeTime } = useBusinessStatus()

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showTime && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {openTime} - {closeTime}
          </span>
        </div>
      )}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
        isOpen 
          ? 'bg-green-100 text-green-700 border border-green-200' 
          : 'bg-red-100 text-red-700 border border-red-200'
      }`}>
        {isOpen ? (
          <CheckCircle className="w-4 h-4" />
        ) : (
          <XCircle className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">{statusText}</span>
      </div>
    </div>
  )
}
