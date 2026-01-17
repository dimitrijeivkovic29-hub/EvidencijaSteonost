package com.farm.steonost.config;

import com.farm.steonost.repo.UserRepo;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    private final UserRepo userRepo;
    private final String allowedOrigins;
    public SecurityConfig(UserRepo userRepo,
                          @Value("${APP_CORS_ALLOWED_ORIGINS:http://localhost:5173}") String allowedOrigins){
        this.userRepo=userRepo;
        this.allowedOrigins = allowedOrigins;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
            .cors(Customizer.withDefaults())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/auth/me").authenticated()
                .requestMatchers(
                        "/api/grla/**",
                        "/api/dogadjaji/**",
                        "/api/izvestaj/**",
                        "/api/mleko/**",
                        "/api/kalendar/**",
                        "/api/teljenja/**",
                        "/api/semena/**"
                ).authenticated()
                .anyRequest().permitAll())
            .httpBasic(Customizer.withDefaults());
        return http.build();
    }

    @Bean PasswordEncoder passwordEncoder(){ return new BCryptPasswordEncoder(); }

    @Bean
    public UserDetailsService users(){
        return username -> userRepo.findByUsername(username)
            .map(u -> org.springframework.security.core.userdetails.User
                .withUsername(u.getUsername())
                .password(u.getPassword())
                .authorities(u.getRoles().split(","))
                .build())
            .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Bean
    public WebMvcConfigurer cors(){
        return new WebMvcConfigurer(){
            @Override public void addCorsMappings(CorsRegistry reg){
                // Dozvoli više origin-a: vrednosti se zadaju kao CSV u APP_CORS_ALLOWED_ORIGINS
                // npr: https://tvoj-frontend.onrender.com,https://tvoj-frontend.netlify.app
                String[] origins = allowedOrigins.split("\\s*,\\s*");
                reg.addMapping("/**")
                        .allowedMethods("*")
                        // koristimo patterns da radi i kad ima kredencijale
                        .allowedOriginPatterns(origins)
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }
}
