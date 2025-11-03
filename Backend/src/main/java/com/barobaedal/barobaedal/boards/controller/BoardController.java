package com.barobaedal.barobaedal.boards.controller;

import com.barobaedal.barobaedal.boards.dto.BoardDto;
import com.barobaedal.barobaedal.boards.service.BoardService;
import com.barobaedal.barobaedal.common.exception.BaseException;
import com.barobaedal.barobaedal.common.response.CommonResponse;
import com.barobaedal.barobaedal.common.response.ResponseType;
import com.barobaedal.barobaedal.common.JwtUtil;
import com.barobaedal.barobaedal.members.repository.MemberRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import java.util.List;

@RestController
@RequestMapping("/api/board")
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;
    private final MemberRepository memberRepository;
    private final JwtUtil jwtUtil;

    private String getRole(String userid) {
        if (userid == null) {
            return null;
        }
        return boardService.getRoleByUserid(userid);
    }

    private Integer getMemberId(String userid) {  return memberRepository.getMemberId(userid);  }

    @GetMapping
    public CommonResponse<Object> getBoards(@RequestHeader(value = "Authorization", required = false) String authHeader, @RequestParam String category) {
        String userid = jwtUtil.auth(authHeader);
        if (userid == null) {
            throw new BaseException("로그인이 필요합니다.");
        }
        String role = getRole(userid);
        List<BoardDto> boards = boardService.getBoardsByCategory(category, role, userid);
        return CommonResponse.builder()
                .responseType(ResponseType.SUCCESS)
                .data(boards)
                .message("리스트 보기")
                .build();
    }

    @GetMapping("/{id}")
    public CommonResponse<Object> getBoard(@RequestHeader(value = "Authorization", required = false) String authHeader, @PathVariable Integer id) {
        String userid = jwtUtil.auth(authHeader);
        if (userid == null) throw new BaseException("로그인이 필요합니다.");

        BoardDto board = boardService.getBoardById(id);
        if (board == null) throw new BaseException("게시물이 없습니다.");

        String role = getRole(userid);
        board.setUserid(userid);
        if (!boardService.canRead(board, role, userid)) throw new BaseException("권한이 없습니다.");

        return CommonResponse.builder()
                .responseType(ResponseType.SUCCESS)
                .data(board)
                .message("상세보기")
                .build();
    }

    // 문의사항, 공지사항 게시판 글쓰기
    @PostMapping
    public CommonResponse<Object> createBoard(@RequestHeader(value = "Authorization", required = false) String authHeader,@RequestBody BoardDto dto) {
        String userid = jwtUtil.auth(authHeader);

        if (userid == null) throw new BaseException("로그인이 필요합니다.");


        String role = getRole(userid);
        Integer memberId = getMemberId(userid);
        if (memberId == null) memberId = boardService.getMemberIdByUserid(userid);    // 예외적으로 memberId가 없으면 userid로 DB에서 조회


        dto.setMemberId(memberId);
        try {
            BoardDto board = boardService.createBoard(dto, role, userid);
            return CommonResponse.builder().responseType(ResponseType.SUCCESS).data(board).message("성공").build();
        } catch (SecurityException | IllegalArgumentException e) {
            throw new BaseException(e.getMessage());
        }
    }

    // 게시글 수정
    @PostMapping("/update/{id}")
    public CommonResponse<Object> updateBoard(@RequestHeader(value = "Authorization", required = false) String authHeader, @PathVariable Integer id, @RequestBody BoardDto dto) {
        String userid = jwtUtil.auth(authHeader);

       if (userid == null) throw new BaseException("로그인이 필요합니다.");

       String role = getRole(userid);
       dto.setId(id);
       dto.setMemberId(getMemberId(userid));
       try {
            BoardDto updated = boardService.updateBoard(dto, role, userid);
            return CommonResponse.builder().responseType(ResponseType.SUCCESS).data(updated).message("게시글 수정").build();
       } catch (SecurityException | IllegalArgumentException e) {
            throw new BaseException(e.getMessage());
       }
    }

    @GetMapping("/delete/{id}")
    public CommonResponse<Object> deleteBoard(@RequestHeader(value = "Authorization", required = false) String authHeader, @PathVariable Integer id, HttpServletRequest request) {
        String userid = jwtUtil.auth(authHeader);
        if (userid == null) throw new BaseException("로그인이 필요합니다.");

        String role = getRole(userid);
        try {
            boardService.deleteBoard(id, role, userid);
            return CommonResponse.builder().responseType(ResponseType.SUCCESS).data(null).message("게시글 삭제").build();
        } catch (SecurityException e) {
            throw new BaseException(e.getMessage());
        }
    }
}
