package com.farm.steonost.config;

import com.farm.steonost.model.UserAccount;
import com.farm.steonost.repo.UserRepo;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Kreira inicijalni ADMIN nalog ako ne postoji u bazi.
 *
 * Username/password možeš promeniti preko ENV varijabli:
 *  - APP_ADMIN_USERNAME
 *  - APP_ADMIN_PASSWORD
 */
@Configuration
public class AdminInitializer {

    @Bean
    CommandLineRunner initAdmin(
            UserRepo userRepo,
            PasswordEncoder encoder,
            @Value("${APP_ADMIN_USERNAME:admin}") String adminUsername,
            @Value("${APP_ADMIN_PASSWORD:admin123}") String adminPassword
    ) {
        return args -> {
            if (!userRepo.existsByUsername(adminUsername)) {
                UserAccount admin = new UserAccount();
                admin.setUsername(adminUsername);
                admin.setPassword(encoder.encode(adminPassword));
                // Spring Security hasRole("ADMIN") očekuje authority "ROLE_ADMIN"
                admin.setRoles("ROLE_ADMIN");
                userRepo.save(admin);
                System.out.println("[INIT] Admin user created: " + adminUsername);
            }
        };
    }
}
