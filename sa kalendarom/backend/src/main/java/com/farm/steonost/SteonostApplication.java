package com.farm.steonost;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import com.farm.steonost.model.*;
import com.farm.steonost.repo.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;

@SpringBootApplication
public class SteonostApplication {
    public static void main(String[] args) { SpringApplication.run(SteonostApplication.class, args); }

    @Bean
    CommandLineRunner seed(GrloRepo grloRepo, DogadjajRepo dogRepo, UserRepo userRepo, PasswordEncoder enc){
        return args -> {
            if(!userRepo.existsByUsername("user"))
                userRepo.save(new UserAccount(null, "user", enc.encode("user"), "ROLE_USER"));
            if(!userRepo.existsByUsername("admin"))
                userRepo.save(new UserAccount(null, "admin", enc.encode("admin"), "ROLE_USER,ROLE_ADMIN"));

            if(grloRepo.findAll().isEmpty()){
                Grlo g1 = new Grlo(null, "RS-001", LocalDate.of(2021,3,1), 1, LocalDate.of(2025,6,10), "user");
                Grlo g2 = new Grlo(null, "RS-002", LocalDate.of(2022,6,15), 0, null, "user");
                grloRepo.save(g1); grloRepo.save(g2);

                dogRepo.save(new Dogadjaj(null, g1, TipDogadjaja.TELJENJE, LocalDate.of(2025,6,10)));
                dogRepo.save(new Dogadjaj(null, g1, TipDogadjaja.OSEMENJAVANJE, LocalDate.now().minusDays(55)));
            }
        }; }
}
