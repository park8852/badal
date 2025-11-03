package com.barobaedal.barobaedal.stores.service;

import com.barobaedal.barobaedal.stores.dto.StoreDto;
import com.barobaedal.barobaedal.stores.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;


@Service
@RequiredArgsConstructor  // 생성자 주입 자동 생성
public class StoreService {

    private final StoreRepository storeRepository;

    public Integer createStore(StoreDto dto) {
        return storeRepository.insert(dto);
    }

    public StoreDto getStore(int id) {
        return storeRepository.findById(id);
    }

    public List<StoreDto> getAllStores() {
        return storeRepository.findAll();
    }

    public void updateStore(int id, StoreDto dto) {
        storeRepository.update(id, dto);
    }

    public void updateByMemberId(int memberId, StoreDto dto) {
        storeRepository.updateByMemberId(memberId, dto);
    }

    public Integer findMemberIdByStoreId(int storeId) {
        return storeRepository.findMemberIdByStoreId(storeId);
    }

    public Integer findStoreIdByMemberId(Integer memberId) {
        return storeRepository.findStoreIdByMemberId(memberId);
    }

    public void deleteStore(int id) {
        storeRepository.delete(id);
    }

    public List<StoreDto> searchStoresByName(String name) {
        return storeRepository.findByNameLike(name);
    }

}