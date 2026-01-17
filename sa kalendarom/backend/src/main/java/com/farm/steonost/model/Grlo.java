package com.farm.steonost.model;

import jakarta.persistence.*;
import java.util.List;
import java.util.ArrayList;
import java.time.LocalDate;

@Entity
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"broj", "ownerUsername"}))
public class Grlo {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable=false)
    private String broj;
    @Column(nullable=false)
    private LocalDate datumRodjenja;
    @Column(nullable=false)
    private int laktacija;
    @Column(nullable=false)
    private int inseminationCount = 0;
    private LocalDate poslednjeTeljenje;
    @Column(nullable=false)
    private String ownerUsername;

    // --- GENETIKA ---
    // HB broj majke (automatski se popunjava kod teladi kreirane kroz obradu teljenja)
    private String hbMajke;

    // Bik (otac) - uzima se sa poslednjeg osemenjavanja relevantnog za teljenje
    private String bikOtac;

    @OneToMany(mappedBy = "grlo", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Dogadjaj> dogadjaji = new ArrayList<>();

    public Grlo(){}
    public Grlo(Long id, String broj, LocalDate datumRodjenja, int laktacija, LocalDate poslednjeTeljenje, String ownerUsername){
        this.id=id; this.broj=broj; this.datumRodjenja=datumRodjenja; this.laktacija=laktacija; this.poslednjeTeljenje=poslednjeTeljenje; this.ownerUsername=ownerUsername;
    }
    public Long getId(){return id;} public void setId(Long id){this.id=id;}
    public String getBroj(){return broj;} public void setBroj(String broj){this.broj=broj;}
    public LocalDate getDatumRodjenja(){return datumRodjenja;} public void setDatumRodjenja(LocalDate d){this.datumRodjenja=d;}
    public int getLaktacija(){return laktacija;} public void setLaktacija(int l){this.laktacija=l;}
    public LocalDate getPoslednjeTeljenje(){return poslednjeTeljenje;} public void setPoslednjeTeljenje(LocalDate p){this.poslednjeTeljenje=p;}
    public String getOwnerUsername(){return ownerUsername;} public void setOwnerUsername(String o){this.ownerUsername=o;}
    public int getInseminationCount(){return inseminationCount;}
    public void setInseminationCount(int c){this.inseminationCount=c;}

    public String getHbMajke() { return hbMajke; }
    public void setHbMajke(String hbMajke) { this.hbMajke = hbMajke; }

    public String getBikOtac() { return bikOtac; }
    public void setBikOtac(String bikOtac) { this.bikOtac = bikOtac; }
}
