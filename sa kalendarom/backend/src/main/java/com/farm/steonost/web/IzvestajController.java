package com.farm.steonost.web;

import com.farm.steonost.dto.IzvestajDTO;
import com.farm.steonost.dto.GenetikaDTO;
import com.farm.steonost.model.*;
import com.farm.steonost.repo.*;
import com.farm.steonost.service.GrloService;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RestController @RequestMapping("/api/izvestaj")
public class IzvestajController {
    private final GrloRepo grloRepo;
    private final DogadjajRepo dogRepo;
    private final GrloService service;

    public IzvestajController(GrloRepo grloRepo, DogadjajRepo dogRepo, GrloService service){
        this.grloRepo = grloRepo; this.dogRepo = dogRepo; this.service = service;
    }

    @GetMapping
    public IzvestajDTO izvestaj(@RequestParam(value="owner", required=false) String owner, Authentication auth){
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a->a.getAuthority().equals("ROLE_ADMIN"));
        String korisnik = (isAdmin && owner!=null && !owner.isBlank()) ? owner : auth.getName();

        List<Grlo> grla = grloRepo.findByOwnerUsername(korisnik);
        LocalDate today = LocalDate.now();

        int total = grla.size();
        int steone = 0;
        int open = 0;
        int trebaProveriti = 0;
        int trebaOsemeniti = 0;

        int lt90 = 0, d90to150 = 0, gt150 = 0;

        Map<YearMonth, Integer> calvingsByMonth = new HashMap<>();

        for(Grlo g : grla){
            var dto = service.mapiraj(g);
            if(dto.steona()) steone++; else open++;

            LocalDate pt = g.getPoslednjeTeljenje();
            if(pt != null){
                long d = ChronoUnit.DAYS.between(pt, today);
                if(d <= 90) lt90++;
                else if(d <= 150) d90to150++;
                else gt150++;
            }

            Dogadjaj poslednjeOs = dogRepo.findFirstByGrloIdAndTipOrderByDatumDesc(g.getId(), TipDogadjaja.OSEMENJAVANJE);
            if((pt != null && ChronoUnit.DAYS.between(pt, today) >= 70) && (poslednjeOs == null || !poslednjeOs.getDatum().isAfter(pt))){
                trebaOsemeniti++;
            }

            if(!dto.steona() && dto.danaOdOsemenjavanja() >= 50){
                trebaProveriti++;
            }

            // Plan teljenja: računamo samo za STEONA grla i od poslednjeg osemenjavanja.
            // Gestacija (krava) ~ 275 dana od zadnjeg osemenjavanja.
            if(dto.steona() && poslednjeOs != null && poslednjeOs.getDatum() != null){
                // ako je osemenjavanje pre (ili na) datum teljenja, ignoriši (nije relevantno za tekuću steonost)
                if(pt == null || poslednjeOs.getDatum().isAfter(pt)){
                    LocalDate expected = poslednjeOs.getDatum().plusDays(275);
                    if(expected.isAfter(today)){
                        YearMonth ym = YearMonth.from(expected);
                        calvingsByMonth.put(ym, calvingsByMonth.getOrDefault(ym,0)+1);
                    }
                }
            }
        }

        List<IzvestajDTO.MonthCount> months = calvingsByMonth.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> new IzvestajDTO.MonthCount(e.getKey().toString(), e.getValue()))
                .toList();

        Map<String,Integer> buckets = new LinkedHashMap<>();
        buckets.put("<=90 dana", lt90);
        buckets.put("90-150 dana", d90to150);
        buckets.put("150+ dana", gt150);

                
        Map<String,Integer> semenapoBiku = new LinkedHashMap<>();
        Map<String,Integer> steonepoBiku = new LinkedHashMap<>();
        for(Grlo g: grla){
            List<Dogadjaj> osAll = dogRepo.findByGrloIdAndTipOrderByDatumDesc(g.getId(), TipDogadjaja.OSEMENJAVANJE);
            for(Dogadjaj d: osAll){
                String b = (d.getBik()==null || d.getBik().isBlank())? "(nepoznat)" : d.getBik();
                semenapoBiku.put(b, semenapoBiku.getOrDefault(b,0)+1);
            }
           
            Dogadjaj lastOs = osAll.isEmpty()? null : osAll.get(0);
            boolean isPreg = service.mapiraj(g).steona();
if(isPreg && lastOs!=null){
                String b = (lastOs.getBik()==null || lastOs.getBik().isBlank())? "(nepoznat)" : lastOs.getBik();
                steonepoBiku.put(b, steonepoBiku.getOrDefault(b,0)+1);
            }
        }
        return new IzvestajDTO(korisnik, today, months, buckets, trebaOsemeniti, trebaProveriti, steone, open, total, steonepoBiku, semenapoBiku);
    }

    /**
     * Genetika (pregled po biku-ocu) na osnovu polja Grlo.bikOtac.
     * U obzir ulaze samo grla koja imaju upisan bikOtac (nije prazno).
     */
    @GetMapping("/genetika")
    public GenetikaDTO genetika(@RequestParam(value="owner", required=false) String owner, Authentication auth){
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a->a.getAuthority().equals("ROLE_ADMIN"));
        String korisnik = (isAdmin && owner!=null && !owner.isBlank()) ? owner : auth.getName();

        List<Grlo> grla = grloRepo.findByOwnerUsername(korisnik);
        int ukupno = grla.size();

        Map<String,Integer> poBiku = new LinkedHashMap<>();
        int saPoznatim = 0;
        for (Grlo g : grla) {
            String bik = g.getBikOtac();
            if (bik == null || bik.isBlank()) continue;
            bik = bik.trim();
            saPoznatim++;
            poBiku.put(bik, poBiku.getOrDefault(bik, 0) + 1);
        }

        // sortiraj opadajuće po broju
        poBiku = poBiku.entrySet().stream()
                .sorted((a,b)->Integer.compare(b.getValue(), a.getValue()))
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue,
                        (a,b)->a, LinkedHashMap::new));

        return new GenetikaDTO(korisnik, LocalDate.now(), ukupno, saPoznatim, poBiku);
    }
}
