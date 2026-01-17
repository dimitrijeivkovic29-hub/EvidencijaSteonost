
package com.farm.steonost.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
public class Dogadjaj {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional=false)
    @JoinColumn(name = "grlo_id", nullable = false)
    private Grlo grlo;

    @Enumerated(EnumType.STRING)
    private TipDogadjaja tip;

    @Column(nullable=false)
    private LocalDate datum;


    private String bik;

    // Za TELJENJE: HB broj (broj) novog teleta, kada se teljenje "obradi"
    private String teleBroj;

    public Dogadjaj(){}

    public Dogadjaj(Long id, Grlo grlo, TipDogadjaja tip, LocalDate datum){
        this.id = id; this.grlo = grlo; this.tip = tip; this.datum = datum;
    }

    public Long getId(){ return id; }
    public void setId(Long id){ this.id = id; }

    public Grlo getGrlo(){ return grlo; }
    public void setGrlo(Grlo grlo){ this.grlo = grlo; }

    public TipDogadjaja getTip(){ return tip; }
    public void setTip(TipDogadjaja tip){ this.tip = tip; }

    public LocalDate getDatum(){ return datum; }
    public void setDatum(LocalDate datum){ this.datum = datum; }

    public String getBik(){ return bik; }
    public void setBik(String bik){ this.bik = bik; }

    public String getTeleBroj(){ return teleBroj; }
    public void setTeleBroj(String teleBroj){ this.teleBroj = teleBroj; }
}
