package com.jiffikart.backend.service;

import com.jiffikart.backend.entity.Category;
import com.jiffikart.backend.repository.CategoryRepository;
import com.jiffikart.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CategoryService {
    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Category saveCategory(Category category) {
        return categoryRepository.save(category);
    }

    public void deleteCategory(Long id) {
        categoryRepository.deleteById(id);
    }

    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id).orElse(null);
    }

    public Map<String, Long> getCategoryProductCounts() {
        List<Category> allCategories = categoryRepository.findAll();
        return allCategories.stream().collect(Collectors.toMap(
            Category::getName,
            c -> (Long) productRepository.countByCategory(c.getName())
        ));
    }
}
