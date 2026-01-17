package com.farm.steonost.web;

import com.farm.steonost.model.UserAccount;
import com.farm.steonost.repo.UserRepo;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController @RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final UserRepo userRepo; private final PasswordEncoder enc;
    public AdminController(UserRepo r, PasswordEncoder e){ this.userRepo=r; this.enc=e; }

    @GetMapping("/users")
    public List<UserAccount> users(){ return userRepo.findAll(); }

    public static record NewUserReq(String username, String password, java.util.List<String> roles){}

    @PostMapping("/users")
    public UserAccount create(@RequestBody NewUserReq req){
        if(req.username()==null || req.username().isBlank()) throw new RuntimeException("username obavezan");
        if(req.password()==null || req.password().isBlank()) throw new RuntimeException("password obavezan");
        if(userRepo.existsByUsername(req.username())) throw new RuntimeException("Username zauzet");
        String roles = (req.roles()==null || req.roles().isEmpty()) ? "ROLE_USER" : String.join(",", req.roles());
        return userRepo.save(new UserAccount(null, req.username(), enc.encode(req.password()), roles));
    }
}
