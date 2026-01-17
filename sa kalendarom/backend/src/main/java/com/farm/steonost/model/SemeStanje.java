package com.farm.steonost.model;

import jakarta.persistence.*;

@Entity
@Table(name = "seme_stanje", uniqueConstraints = {
        @UniqueConstraint(name = "uk_seme_bik", columnNames = {"bik"})
})
public class SemeStanje {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String bik;

    @Column(nullable = false)
    private int kolicina;

    public SemeStanje() {}

    public SemeStanje(String bik, int kolicina) {
        this.bik = bik;
        this.kolicina = kolicina;
    }

    public Long getId() { return id; }

    public String getBik() { return bik; }
    public void setBik(String bik) { this.bik = bik; }

    public int getKolicina() { return kolicina; }
    public void setKolicina(int kolicina) { this.kolicina = kolicina; }
}
