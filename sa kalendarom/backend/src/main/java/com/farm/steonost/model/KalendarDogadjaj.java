package com.farm.steonost.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "kalendar_dogadjaj")
public class KalendarDogadjaj {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional=false)
    @JoinColumn(name = "grlo_id", nullable = false)
    private Grlo grlo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private TipKalendar tip;

    @Column(nullable=false, length=120)
    private String naziv;

    @Column(nullable=false)
    private LocalDate datumDogadjaja;

    @Column(nullable=true)
    private LocalDate datumPodsetnika;

    @Column(nullable=true, length=500)
    private String poruka;

    // za filtriranje po korisniku
    @Column(nullable=false)
    private String korisnickoIme;

    public KalendarDogadjaj(){}

    public Long getId(){ return id; }
    public void setId(Long id){ this.id = id; }

    public Grlo getGrlo(){ return grlo; }
    public void setGrlo(Grlo grlo){ this.grlo = grlo; }

    public TipKalendar getTip(){ return tip; }
    public void setTip(TipKalendar tip){ this.tip = tip; }

    public String getNaziv(){ return naziv; }
    public void setNaziv(String naziv){ this.naziv = naziv; }

    public LocalDate getDatumDogadjaja(){ return datumDogadjaja; }
    public void setDatumDogadjaja(LocalDate d){ this.datumDogadjaja = d; }

    public LocalDate getDatumPodsetnika(){ return datumPodsetnika; }
    public void setDatumPodsetnika(LocalDate d){ this.datumPodsetnika = d; }

    public String getPoruka(){ return poruka; }
    public void setPoruka(String p){ this.poruka = p; }

    public String getKorisnickoIme(){ return korisnickoIme; }
    public void setKorisnickoIme(String k){ this.korisnickoIme = k; }
}