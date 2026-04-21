package com.smartcampus.smart_campus.repo;

import com.smartcampus.smart_campus.entities.User;
import com.smartcampus.smart_campus.enums.Role;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserRepo extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByRefreshToken(String refreshToken);

    Optional<User> findByPhoneNumber(String phoneNumber);

    List<User> findAllByOrderByFirstnameAscLastNameAsc();

    List<User> findByRoleOrderByFirstnameAscLastNameAsc(Role role);

    List<User> findByFirstnameContainingIgnoreCaseOrderByFirstnameAscLastNameAsc(String firstname);

    List<User> findByFirstnameContainingIgnoreCaseOrLastNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrderByFirstnameAscLastNameAsc(
            String firstname,
            String lastName,
            String email
    );

    Optional<User> findFirstByFirstnameIgnoreCaseAndLastNameIgnoreCase(String firstname, String lastName);

    List<User> findByFirstnameIgnoreCase(String firstname);

    List<User> findByLastNameIgnoreCase(String lastName);

    @Transactional
    @Modifying
    @Query("update User u set u.password = ?2 where u.email = ?1")
    void updatePassword(String email, String password);
}
