package com.jiffikart.backend.controller;

import com.jiffikart.backend.entity.BlogPost;
import com.jiffikart.backend.repository.BlogPostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/public/blogs")
public class BlogController {

    @Autowired
    private BlogPostRepository blogPostRepository;

    @GetMapping
    public ResponseEntity<List<BlogPost>> getBlogs(
            @RequestParam(required = false) UUID cityId,
            @RequestParam(required = false) UUID zoneId
    ) {
        if (zoneId != null) {
            // Priority: Zone > City > Global
            List<BlogPost> blogs = blogPostRepository.findByZoneIdAndIsActiveTrue(zoneId);
            if (cityId != null) {
                blogs.addAll(blogPostRepository.findByCityIdAndZoneIdIsNullAndIsActiveTrue(cityId));
            }
            blogs.addAll(blogPostRepository.findByCityIdIsNullAndZoneIdIsNullAndIsActiveTrue());
            return ResponseEntity.ok(blogs.stream().distinct().toList());
        } else if (cityId != null) {
            // City + Global
            List<BlogPost> cityBlogs = blogPostRepository.findByCityIdAndIsActiveTrue(cityId);
            List<BlogPost> globalBlogs = blogPostRepository.findByCityIdIsNullAndIsActiveTrue();
            cityBlogs.addAll(globalBlogs);
            return ResponseEntity.ok(cityBlogs.stream().distinct().toList());
        }
        return ResponseEntity.ok(blogPostRepository.findByIsActiveTrue());
    }
}
