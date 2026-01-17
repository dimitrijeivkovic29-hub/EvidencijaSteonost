package com.farm.steonost.web;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/auth")
public class AuthController {
    @GetMapping("/me")
    public Object me(Authentication auth){
        return java.util.Map.of("username", auth.getName(),
                "roles", auth.getAuthorities().stream().map(Object::toString).toList());
    }
}
