package com.farm.steonost.service;

import com.farm.steonost.dto.GrloListItemDTO;
import com.farm.steonost.model.*;
import com.farm.steonost.repo.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class GrloService {
    private final GrloRepo grloRepo; private final DogadjajRepo dogRepo;
    public GrloService(GrloRepo g, DogadjajRepo d){this.grloRepo=g; this.dogRepo=d;}

    public List<Grlo> mojaGrla(String owner){ return grloRepo.findByOwnerUsername(owner); }

    public Grlo sacuvajGrlo(Grlo g){
        if (g.getLaktacija() > 0 && g.getPoslednjeTeljenje() == null) {
            throw new IllegalArgumentException("Ako je laktacija > 0, poslednje teljenje mora biti uneto");
        }
       
        if (g.getBroj() != null) g.setBroj(g.getBroj().trim());
        if (g.getOwnerUsername() != null) g.setOwnerUsername(g.getOwnerUsername().trim());

        // Prvo sačuvaj grlo da bismo imali ID.
        Grlo saved = grloRepo.save(g);

        // Ako je u administraciji uneto "poslednje teljenje", obezbedi da postoji TELJENJE događaj
        // (da bi se krava pojavila na listi Teljenja poslednja 3 meseca).
        if (saved.getLaktacija() > 0 && saved.getPoslednjeTeljenje() != null && saved.getId() != null) {
            Dogadjaj lastTelj = dogRepo.findFirstByGrloIdAndTipOrderByDatumDesc(saved.getId(), TipDogadjaja.TELJENJE);
            if (lastTelj == null || lastTelj.getDatum() == null || !lastTelj.getDatum().isEqual(saved.getPoslednjeTeljenje())) {
                Dogadjaj telj = new Dogadjaj();
                telj.setGrlo(saved);
                telj.setTip(TipDogadjaja.TELJENJE);
                telj.setDatum(saved.getPoslednjeTeljenje());
                telj.setBik(null);
                telj.setTeleBroj(null);
                dogRepo.save(telj);
            }
        }

        return saved;
    }

    public GrloListItemDTO mapiraj(Grlo g){
        LocalDate danas = LocalDate.now();
        LocalDate posTelj = g.getPoslednjeTeljenje();

        Dogadjaj poslednjeOs = (g.getId()==null) ? null
                : dogRepo.findFirstByGrloIdAndTipOrderByDatumDesc(g.getId(), TipDogadjaja.OSEMENJAVANJE);

        Dogadjaj poslednjaPotvrda = (g.getId()==null) ? null
                : dogRepo.findFirstByGrloIdAndTipOrderByDatumDesc(g.getId(), TipDogadjaja.POTVRDJENA_STEONOST);

        boolean steona = false;
        if(poslednjaPotvrda != null){
            boolean posleTeljenja = (posTelj == null) || poslednjaPotvrda.getDatum().isAfter(posTelj);
            boolean posleOs = (poslednjeOs == null) || !poslednjaPotvrda.getDatum().isBefore(poslednjeOs.getDatum());
            steona = posleTeljenja && posleOs; 
        }

        long danaOdTeljenja = 0L;
        if (g.getLaktacija() > 0 && posTelj != null) {
            danaOdTeljenja = ChronoUnit.DAYS.between(posTelj, danas);
        }

        long danaOdOs = 0L;
        if (poslednjeOs != null && poslednjeOs.getDatum() != null) {
            if (posTelj != null && (poslednjeOs.getDatum().isBefore(posTelj) || poslednjeOs.getDatum().isEqual(posTelj))) {
                danaOdOs = 0L;
            } else {
                danaOdOs = ChronoUnit.DAYS.between(poslednjeOs.getDatum(), danas);
            }
        }

        int brojOsemenjavanja = (int) dogRepo.findByGrloIdAndTipOrderByDatumDesc(g.getId(), TipDogadjaja.OSEMENJAVANJE).size();

      
        Dogadjaj poslednjeZasusenje = dogRepo.findFirstByGrloIdAndTipOrderByDatumDesc(g.getId(), TipDogadjaja.ZASUSENJE);
        String status;
        if(poslednjeZasusenje != null){
            status = "Zasušena";
        } else if(steona){
            status = "Steona";
        } else if(poslednjeOs != null){
            long d = danaOdOs;
            status = (d > 45) ? "Za proveru" : "Osemenjena";
        } else if(posTelj != null){
            boolean nistaPosleTeljenja = true;
            java.util.List<Dogadjaj> svi = dogRepo.findByGrloIdOrderByDatumDesc(g.getId());
            for(Dogadjaj d : svi){ if(d.getDatum().isAfter(posTelj)) { nistaPosleTeljenja = false; break; } }
            status = (danaOdTeljenja > 50 && nistaPosleTeljenja) ? "Za rad" : "Otvorena";
        } else {
            status = "Otvorena";
        }

        return new GrloListItemDTO(
                g.getId(), g.getBroj(), g.getDatumRodjenja(), g.getLaktacija(),
                posTelj, danaOdOs, danaOdTeljenja, steona, brojOsemenjavanja, status);
    }

    public java.util.List<GrloListItemDTO> listForOwner(String owner){
        java.util.List<com.farm.steonost.model.Grlo> grla = grloRepo.findByOwnerUsername(owner);
        java.util.List<GrloListItemDTO> out = new java.util.ArrayList<>();
        for(com.farm.steonost.model.Grlo g : grla){
            out.add(toItem(g));
        }
        return out;
    }

    private GrloListItemDTO toItem(com.farm.steonost.model.Grlo g){
        java.time.LocalDate danas = java.time.LocalDate.now();
        var poslednjeTeljenje = dogRepo.findFirstByGrloIdAndTipOrderByDatumDesc(g.getId(), TipDogadjaja.TELJENJE);
        java.time.LocalDate posTelj = poslednjeTeljenje==null? null : poslednjeTeljenje.getDatum();

        long danaOdTeljenja = 0L;
        if(posTelj!=null){
            danaOdTeljenja = java.time.temporal.ChronoUnit.DAYS.between(posTelj, danas);
        }

        var poslednjaPotvrda = dogRepo.findFirstByGrloIdAndTipOrderByDatumDesc(g.getId(), TipDogadjaja.POTVRDJENA_STEONOST);
        var poslednjeOs = dogRepo.findFirstByGrloIdAndTipOrderByDatumDesc(g.getId(), TipDogadjaja.OSEMENJAVANJE);

        boolean steona = false;
        if(poslednjaPotvrda!=null){
            steona = (poslednjeOs==null) || poslednjeOs.getDatum().isBefore(poslednjaPotvrda.getDatum());
        }

        Long danaOdOs = 0L;
        if(poslednjeOs!=null){
            if(posTelj!=null && (poslednjeOs.getDatum().isBefore(posTelj) || poslednjeOs.getDatum().isEqual(posTelj))){
                danaOdOs = 0L;
            } else {
                danaOdOs = java.time.temporal.ChronoUnit.DAYS.between(poslednjeOs.getDatum(), danas);
            }
        }

        int brojOsemenjavanja = (int) dogRepo.findByGrloIdAndTipOrderByDatumDesc(g.getId(), TipDogadjaja.OSEMENJAVANJE).size();

        String status;
        
        Dogadjaj poslednjeZasusenje = dogRepo.findFirstByGrloIdAndTipOrderByDatumDesc(g.getId(), TipDogadjaja.ZASUSENJE);
        if(poslednjeZasusenje != null){
            status = "Zasušena";
        } else if(steona){
            status = "Steona";
        } else if(poslednjeOs != null){
            long d = danaOdOs;
            status = (d > 45) ? "Za proveru" : "Osemenjena";
        } else if(posTelj != null){
            boolean nistaPosleTeljenja = true;
            java.util.List<Dogadjaj> svi = dogRepo.findByGrloIdOrderByDatumDesc(g.getId());
            for(Dogadjaj d : svi){ if(d.getDatum().isAfter(posTelj)) { nistaPosleTeljenja = false; break; } }
            status = (danaOdTeljenja > 50 && nistaPosleTeljenja) ? "Za rad" : "Otvorena";
        } else {
            status = "Otvorena";
        }
        return new GrloListItemDTO(
            g.getId(), g.getBroj(), g.getDatumRodjenja(), g.getLaktacija(),
            posTelj, danaOdOs, danaOdTeljenja, steona, brojOsemenjavanja, status
        );
    }

}