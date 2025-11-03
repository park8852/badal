package com.barobaedal.barobaedal.common;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.regex.Pattern;

@Service
public class FileStorageService {

    private final Path uploadDir;

    // 파일명에서 허용하지 않을 문자 패턴 (디렉터리 구분자, 제어문자 등 제거)
    private static final Pattern UNSAFE_CHARS = Pattern.compile("[\\\\/\\p{Cntrl}]");

    public FileStorageService(@Value("${app.upload.dir}") String uploadDir) throws IOException {
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(this.uploadDir);
    }

    public String storeFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) return null;

        // 원본 파일명 취득 및 경로 요소 제거 (경로조작 방지)
        String original = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
        String baseName = Paths.get(original).getFileName().toString();

        // 위험 문자 제거 (파일명 내부의 /, \, null, 제어문자 등)
        String safeName = UNSAFE_CHARS.matcher(baseName).replaceAll("_");

        // 만약 빈 이름이 되면 기본명 부여
        if (safeName.trim().isEmpty()) {
            safeName = "file";
        }

        // 타겟 경로 계산 및 경로 조작 방지
        Path target = uploadDir.resolve(safeName).normalize();
        if (!target.startsWith(uploadDir)) {
            throw new SecurityException("잘못된 파일 경로입니다.");
        }

        // 임시파일에 먼저 쓰고 원자적으로 이동하여 덮어쓰기(가능하면 ATOMIC_MOVE 사용)
        Path tempFile = Files.createTempFile(uploadDir, "upload-", ".tmp");
        try {
            // 임시파일에 내용 기록
            Files.copy(file.getInputStream(), tempFile, StandardCopyOption.REPLACE_EXISTING);

            // ATOMIC_MOVE 지원 여부에 따라 이동 시도
            try {
                Files.move(tempFile, target, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
            } catch (AtomicMoveNotSupportedException ex) {
                Files.move(tempFile, target, StandardCopyOption.REPLACE_EXISTING);
            }

        } finally {
            // 임시파일이 남아 있으면 삭제 시도
            try { if (Files.exists(tempFile)) Files.deleteIfExists(tempFile); } catch (IOException ignored) {}
        }

        // 반환: 컨트롤러/프론트에서 접근할 수 있는 URL 경로(리소스 핸들러가 /upload/** -> file:./upload/ 로 매핑되어 있어야 함)
        return "upload/" + safeName;
    }

    // VULNERABLE VERSION: 파일 업로드 취약점
    // 경고: 이 메서드는 파일 확장자 검증 없음, 경로 조작 가능
    public String storeFileVulnerable(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) return null;

        // 취약점 1: 파일명 검증 없이 사용
        String filename = file.getOriginalFilename();
        
        // 취약점 2: 경로 조작 방지 검증 없음
        // 예: "../../../etc/passwd" 입력 가능
        Path target = uploadDir.resolve(filename);

        // 취약점 3: 파일 확장자 검증 없음
        // 예: .jsp, .exe, .sh 파일 업로드 가능

        // 취약점 4: 중복 파일명 덮어쓰기 가능
        
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        
        return "upload/" + filename;
    }
}