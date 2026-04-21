package com.smartcampus.smart_campus.repo;

import com.smartcampus.smart_campus.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepo extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

}

