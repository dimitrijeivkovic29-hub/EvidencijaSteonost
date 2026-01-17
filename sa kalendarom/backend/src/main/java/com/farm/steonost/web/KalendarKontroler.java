package com.farm.steonost.web;

import com.farm.steonost.model.*;
import com.farm.steonost.repo.KalendarDogadjajRepo;
import com.farm.steonost.repo.GrloRepo;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/kalendar")
public class KalendarKontroler {
    private final KalendarDogadjajRepo repo;
    private final GrloRepo grloRepo;

    public KalendarKontroler(KalendarDogadjajRepo repo, GrloRepo grloRepo){
        this.repo = repo; this.grloRepo = grloRepo;
    }

    @GetMapping
    public List<KalendarDogadjaj> lista(@RequestParam String from, @RequestParam String to, Authentication auth){
        String korisnik = auth.getName();
        LocalDate od = LocalDate.parse(from);
        LocalDate doDatuma = LocalDate.parse(to);
        return repo.pronadjiProzor(korisnik, od, doDatuma);
    }

    @PostMapping
    public KalendarDogadjaj kreiraj(@RequestBody Map<String, String> body, Authentication auth){
        String korisnik = auth.getName();
        String broj = body.get("brojGrla");
        Grlo grlo = grloRepo.findByBrojAndOwnerUsername(broj, korisnik)
            .orElseThrow(() -> new RuntimeException("Grlo sa brojem " + broj + " ne postoji kod korisnika " + korisnik));

        KalendarDogadjaj ev = new KalendarDogadjaj();
        ev.setGrlo(grlo);
        ev.setKorisnickoIme(korisnik);
        ev.setNaziv(body.getOrDefault("naziv", "Događaj"));
        ev.setTip(TipKalendar.valueOf(body.getOrDefault("tip", "DRUGO")));
        ev.setDatumDogadjaja(LocalDate.parse(body.get("datumDogadjaja")));
        if(body.get("datumPodsetnika") != null && !body.get("datumPodsetnika").isBlank()){
            ev.setDatumPodsetnika(LocalDate.parse(body.get("datumPodsetnika")));
        }
        ev.setPoruka(body.getOrDefault("poruka", ""));
        return repo.save(ev);
    }

    @DeleteMapping("/{id}")
    public void obrisi(@PathVariable Long id, Authentication auth){
        var ev = repo.findById(id).orElseThrow();
        if(!ev.getKorisnickoIme().equals(auth.getName())){
            throw new RuntimeException("Zabranjeno");
        }
        repo.deleteById(id);
    }
}