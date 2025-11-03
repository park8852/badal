package com.barobaedal.barobaedal.boards.service;

import com.barobaedal.barobaedal.boards.dto.BoardDto;
import com.barobaedal.barobaedal.boards.repository.BoardRepository;
import com.barobaedal.barobaedal.members.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BoardService {
    private final BoardRepository boardRepository;
    private final MemberRepository memberRepository;

    public String getRoleByUserid(String userid){
        return memberRepository.getRole(userid);
    }

    public List<BoardDto> getBoardsByCategory(String category, String memberRole, String userid) {
        if ("qna".equalsIgnoreCase(category) || "ADMIN".equalsIgnoreCase(memberRole)) {
            return boardRepository.findByCategoryAndMemberId(category, memberRole, userid);
        } else {
            return boardRepository.findByCategory(category);
        }
    }


    public BoardDto getBoardById(Integer id) {
        return boardRepository.findById(id);
    }

    public BoardDto updateBoard(BoardDto dto, String memberRole, String userid) {
        validateCreateOrUpdate(dto, memberRole, userid);
        return boardRepository.update(dto);
    }

    public void deleteBoard(Integer id, String memberRole, String userid) {
        BoardDto board = boardRepository.findById(id);
        if (board == null) {
            throw new IllegalArgumentException("게시물이 존재하지 않습니다.");
        }
        if (!canModify(board, memberRole, userid)) {
            throw new SecurityException("권한이 없습니다.");
        }

        boardRepository.deleteById(id);

    }

    // 생성 수정 권한 검증
    private void validateCreateOrUpdate(BoardDto dto, String memberRole, String userid) {
        if (!canModify(dto, memberRole, userid)) {
            throw new SecurityException("권한이 없습니다.");
        }
    }

    // 권한 체크 메서드
    private boolean canModify(BoardDto board, String role, String userid) {
        if ("notice".equalsIgnoreCase(board.getCategory())) {
            // 공지사항은 Admin만 CRUD 가능
            return "ADMIN".equalsIgnoreCase(role);
        } else if ("qna".equalsIgnoreCase(board.getCategory())) {
            // 문의하기는 USER/ADMIN 모두 CRUD 가능
            return ("ADMIN".equalsIgnoreCase(role)) || (memberRepository.getMemberIdByUserid(userid).equals(board.getMemberId()));
        }
        return false;
    }

    public boolean canRead(BoardDto board, String role, String userid) {
        if ("notice".equalsIgnoreCase(board.getCategory())) {
            return true; // 누구나 읽기 가능
        } else if ("qna".equalsIgnoreCase(board.getCategory())) {
            return (memberRepository.getMemberIdByUserid(userid).equals(board.getMemberId())) || "ADMIN".equalsIgnoreCase(role);
        }
        return false;
    }

    public BoardDto createBoard(BoardDto dto, String role, String userid) {
        Integer id = getMemberIdByUserid(userid);

        if ("notice".equalsIgnoreCase(dto.getCategory()) && !"ADMIN".equalsIgnoreCase(role)) {
            throw new SecurityException("공지사항 글 작성 권한이 없습니다.");
        }
        if ("qna".equalsIgnoreCase(dto.getCategory()) &&
                !("ADMIN".equalsIgnoreCase(role) || id.equals(dto.getMemberId()))) {
            throw new SecurityException("문의사항 글 작성 권한이 없습니다.");
        }
        // 작성자 ID 설정
        dto.setMemberId(id);
        dto.setCreatedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_DATE));
        return boardRepository.save(dto);
    }

    public Integer getMemberIdByUserid(String userid) {
        return memberRepository.getMemberIdByUserid(userid);
    }
}
