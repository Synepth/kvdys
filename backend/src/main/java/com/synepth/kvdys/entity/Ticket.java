package com.synepth.kvdys.entity;

import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Title is required")
    private String title;

    @Size(max = 255, message = "Description can be at most 255 characters")
    private String description;

    private String priority;

    private String status;

    private String createdBy;

    private String comment;

    private String createdAt;

}
