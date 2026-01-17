
package com.farm.steonost.web;

import com.farm.steonost.model.*;
import com.farm.steonost.repo.DogadjajRepo;
import com.farm.steonost.repo.GrloRepo;
import com.farm.steonost.service.GrloService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.ArrayList;

@RestController @RequestMapping("/api/dogadjaji")
public class DogadjajController {
    private final DogadjajRepo repo; private final GrloRepo grloRepo; private final GrloService service;
    public DogadjajController(DogadjajRepo r, GrloRepo g, GrloService s){this.repo=r; this.grloRepo=g; this.service=s;}

    @GetMapping("/{grloId}")
    public List<Dogadjaj> lista(@PathVariable Long grloId){
        return repo.findByGrloIdOrderByDatumDesc(grloId);
    }

    @PostMapping("/{grloId}")
    public Dogadjaj dodaj(@PathVariable Long grloId, @RequestBody Dogadjaj body, Authentication auth,
                          @RequestParam(required=false, defaultValue = "false") boolean force){
        Grlo g = grloRepo.findById(grloId).orElseThrow();
        if(!g.getOwnerUsername().equals(auth.getName())) throw new RuntimeException("Nemaš pristup ovom grlu");
        body.setId(null); body.setGrlo(g);
        if(body.getDatum()==null) body.setDatum(LocalDate.now());


        
        if(body.getTip()==TipDogadjaja.ZASUSENJE){
           
            boolean isPreg = new com.farm.steonost.service.GrloService(grloRepo, repo).mapiraj(g).steona();
            if(!isPreg) throw new RuntimeException("ZASUSENJE_NIJE_STEONA: Krava mora biti steona da bi mogla da se zasuši.");
        }
        if(body.getTip()==TipDogadjaja.OSEMENJAVANJE){
           
            Dogadjaj lastOs = repo.findFirstByGrloIdAndTipOrderByDatumDesc(g.getId(), TipDogadjaja.OSEMENJAVANJE);
            if(lastOs!=null && body.getDatum().isBefore(lastOs.getDatum())){
                throw new RuntimeException("OSEMENJAVANJE_DATUM_GRESKA: Datum je pre poslednjeg osemenjavanja ("+lastOs.getDatum()+").");
            }
        }
        if(body.getTip()==TipDogadjaja.POTVRDJENA_STEONOST){
           
            java.util.List<Dogadjaj> osList = repo.findByGrloIdAndTipOrderByDatumDesc(g.getId(), TipDogadjaja.OSEMENJAVANJE);
            if(osList.isEmpty()) throw new RuntimeException("STEONOST_BEZ_OSEMENJAVANJA: Nije moguće potvrditi steonost bez prethodnog osemenjavanja.");
        }
        

        if(body.getTip()==TipDogadjaja.OSEMENJAVANJE){
            g.setInseminationCount(g.getInseminationCount()+1);
            grloRepo.save(g);
            if(body.getDatum().isAfter(LocalDate.now())) throw new RuntimeException("Datum osemenjavanja ne može biti u budućnosti.");
            if(body.getBik()==null || body.getBik().isBlank()) throw new RuntimeException("Za osemenjavanje moraš uneti bika.");
        } else if(body.getTip()==TipDogadjaja.TELJENJE){
            Dogadjaj posOs = repo.findFirstByGrloIdAndTipOrderByDatumDesc(g.getId(), TipDogadjaja.OSEMENJAVANJE);
            if(posOs!=null){
                long dan = ChronoUnit.DAYS.between(posOs.getDatum(), body.getDatum());
                if(dan < 250 && !force) throw new RuntimeException("POTVRDI_TELJENJE: Steonost < 250 dana za grlo "+g.getBroj()+" ("+dan+"d). Ako si siguran, ponovi sa force=true.");
            }
            g.setPoslednjeTeljenje(body.getDatum());
            g.setLaktacija(Math.max(g.getLaktacija(), 1));
            // Nakon teljenja broj osemenjavanja treba da krene ispočetka
            g.setInseminationCount(0);
            grloRepo.save(g);
        }
        return repo.save(body);
    }

    public static record BulkReq(java.util.List<String> brojevi, TipDogadjaja tip, java.time.LocalDate datum, String owner, String bik, Boolean force){}

    @PostMapping("/bulkByBroj")
    public List<Dogadjaj> dodajBulk(@RequestBody BulkReq req, Authentication auth){
        String actor = auth.getName();
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a->a.getAuthority().equals("ROLE_ADMIN"));
        String owner = (isAdmin && req.owner()!=null && !req.owner().isBlank()) ? req.owner() : actor;

        List<String> ids = (req.brojevi()==null)? List.of() : req.brojevi();
        if(ids.isEmpty()) throw new RuntimeException("Lista brojeva je prazna");

        LocalDate datum = (req.datum()!=null)? req.datum() : LocalDate.now();
        boolean force = req.force()!=null ? req.force() : false;

        List<Grlo> grla = isAdmin
            ? grloRepo.findByBrojIn(ids).stream().filter(g-> g.getOwnerUsername().equals(owner)).toList()
            : grloRepo.findByBrojInAndOwnerUsername(ids, owner);

        if(grla.isEmpty()) throw new RuntimeException("Nisu pronađena grla za zadate brojeve/owner");

                
        if(req.tip()==TipDogadjaja.POTVRDJENA_STEONOST){
            java.util.List<String> already = new java.util.ArrayList<>();
            for(Grlo gg: grla){ if(service.mapiraj(gg).steona()) already.add(gg.getBroj()); }
            if(!already.isEmpty()) throw new RuntimeException("VEĆ_STEONA: Već steone: "+String.join(", ", already));
        }

      
        if(req.tip()==TipDogadjaja.TELJENJE){
            java.util.List<String> bez = new java.util.ArrayList<>();
            for(Grlo gg: grla){ if(repo.findByGrloIdAndTipOrderByDatumDesc(gg.getId(), TipDogadjaja.OSEMENJAVANJE).isEmpty()) bez.add(gg.getBroj()); }
            if(!bez.isEmpty()) throw new RuntimeException("NIJE_OSEMENJENA: Nisu osemenjene: "+String.join(", ", bez));
        }

      
        if(req.tip()==TipDogadjaja.OSEMENJAVANJE && !force){
            java.util.List<String> already = new java.util.ArrayList<>();
            for(Grlo gg: grla){ if(service.mapiraj(gg).steona()) already.add(gg.getBroj()); }
            if(!already.isEmpty()) throw new RuntimeException("POTVRDI_OSEMENJAVANJE_NA_STEONU: Već steone: "+String.join(", ", already)+". Ako si siguran, ponovi sa force=true.");
        }

       
        if(req.tip()==TipDogadjaja.TELJENJE && !force){
            List<String> risky = new ArrayList<>();
            for(Grlo g: grla){
                Dogadjaj posOs = repo.findFirstByGrloIdAndTipOrderByDatumDesc(g.getId(), TipDogadjaja.OSEMENJAVANJE);
                if(posOs!=null){
                    long dan = ChronoUnit.DAYS.between(posOs.getDatum(), datum);
                    if(dan < 250) risky.add(g.getBroj()+" ("+dan+"d)");
                }
            }
            if(!risky.isEmpty()){
                throw new RuntimeException("POTVRDI_TELJENJE: Steonost < 250 dana za: "+String.join(", ", risky)+" ");
            }
        }

        List<Dogadjaj> out = new ArrayList<>();
        for(Grlo g: grla){
            Dogadjaj d = new Dogadjaj(null, g, req.tip(), datum);
            if(req.tip()==TipDogadjaja.OSEMENJAVANJE){
                g.setInseminationCount(g.getInseminationCount()+1);
                grloRepo.save(g);
                if(datum.isAfter(LocalDate.now())) throw new RuntimeException("Datum osemenjavanja ne može biti u budućnosti.");
                if(req.bik()==null || req.bik().isBlank()) throw new RuntimeException("Za osemenjavanje moraš uneti bika.");
                d.setBik(req.bik());
            } else if(req.tip()==TipDogadjaja.TELJENJE){
                g.setPoslednjeTeljenje(datum);
                g.setLaktacija(Math.max(g.getLaktacija(), 1));
                // Nakon teljenja broj osemenjavanja treba da krene ispočetka
                g.setInseminationCount(0);
                grloRepo.save(g);
            }
            out.add(repo.save(d));
        }
        return out;
    }

    @DeleteMapping("/event/{id}")
    public void obrisiDogadjaj(@PathVariable Long id, Authentication auth){
        Dogadjaj d = repo.findById(id).orElseThrow();
        Grlo g = d.getGrlo();
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a->a.getAuthority().equals("ROLE_ADMIN"));
        if(!isAdmin && !g.getOwnerUsername().equals(auth.getName())) throw new RuntimeException("Nemaš pristup");
       
        if(d.getTip()==TipDogadjaja.OSEMENJAVANJE){
            g.setInseminationCount(Math.max(0, g.getInseminationCount()-1));
            grloRepo.save(g);
        }
        repo.delete(d);
    }
}
