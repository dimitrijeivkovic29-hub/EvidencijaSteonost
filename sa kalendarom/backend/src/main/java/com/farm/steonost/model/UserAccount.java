package com.farm.steonost.model;

import jakarta.persistence.*;

@Entity
public class UserAccount {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable=false, unique=true)
    private String username;
    @Column(nullable=false)
    private String password;
    @Column(nullable=false)
    private String roles;

    public UserAccount(){}
    public UserAccount(Long id, String username, String password, String roles){
        this.id=id; this.username=username; this.password=password; this.roles=roles;
    }
    public Long getId(){return id;} public void setId(Long id){this.id=id;}
    public String getUsername(){return username;} public void setUsername(String u){this.username=u;}
    public String getPassword(){return password;} public void setPassword(String p){this.password=p;}
    public String getRoles(){return roles;} public void setRoles(String r){this.roles=r;}
}
