package com.farm.steonost.model;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(
        name = "mleko_dnevno",
        uniqueConstraints = @UniqueConstraint(columnNames = {"datum", "ownerUsername"})
)
public class MlekoDnevno {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate datum;

    @Column(nullable = false)
    private double litaraUkupno;

    @Column(nullable = false)
    private double litaraTelad;

    // Ručne korekcije liste krava koje se muzu za taj datum
    // Čuvamo kao CSV listu ID-jeva ("1,2,3") radi jednostavnosti.
    @Column(columnDefinition = "TEXT")
    private String includeIdsCsv;

    @Column(columnDefinition = "TEXT")
    private String excludeIdsCsv;

    @Column(nullable = false)
    private String ownerUsername;

    public MlekoDnevno() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDate getDatum() { return datum; }
    public void setDatum(LocalDate datum) { this.datum = datum; }

    public double getLitaraUkupno() { return litaraUkupno; }
    public void setLitaraUkupno(double litaraUkupno) { this.litaraUkupno = litaraUkupno; }

    public double getLitaraTelad() { return litaraTelad; }
    public void setLitaraTelad(double litaraTelad) { this.litaraTelad = litaraTelad; }

    public String getIncludeIdsCsv() { return includeIdsCsv; }
    public void setIncludeIdsCsv(String includeIdsCsv) { this.includeIdsCsv = includeIdsCsv; }

    public String getExcludeIdsCsv() { return excludeIdsCsv; }
    public void setExcludeIdsCsv(String excludeIdsCsv) { this.excludeIdsCsv = excludeIdsCsv; }

    public String getOwnerUsername() { return ownerUsername; }
    public void setOwnerUsername(String ownerUsername) { this.ownerUsername = ownerUsername; }
}
