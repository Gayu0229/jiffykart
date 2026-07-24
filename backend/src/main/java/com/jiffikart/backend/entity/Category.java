package com.jiffikart.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "categories")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String name;

    @ElementCollection
    @CollectionTable(name = "subcategory_names", joinColumns = @JoinColumn(name = "category_id"))
    @Column(name = "subcategory_name")
    private List<String> subCategories;

    @Builder.Default
    private Boolean isActive = true;

    private String imageUrl;
}
