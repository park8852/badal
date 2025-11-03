package com.barobaedal.barobaedal.menus.service;

import com.barobaedal.barobaedal.menus.dto.MenuDto;
import com.barobaedal.barobaedal.menus.repository.MenuRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MenuService {

    private final MenuRepository menuRepository;

    public void createMenu(MenuDto menu) {
        menuRepository.insert(menu);
    }

    public MenuDto getMenu(int id) {
        return menuRepository.findById(id);
    }

    public List<MenuDto> getMenusByStore(int storeId) {
        return menuRepository.findAllByStoreId(storeId);
    }

    public void updateMenu(int id, MenuDto menu) {
        menuRepository.update(id, menu);
    }

    public void deleteMenu(int id) {
        menuRepository.delete(id);
    }
}