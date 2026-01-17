package com.farm.steonost.web;

import com.farm.steonost.dto.TeljenjeItemDTO;
import com.farm.steonost.model.Dogadjaj;
import com.farm.steonost.model.Grlo;
import com.farm.steonost.model.TipDogadjaja;
import com.farm.steonost.repo.DogadjajRepo;
import com.farm.steonost.repo.GrloRepo;
import com.farm.steonost.service.GrloService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/teljenja")
public class TeljenjeController {

    private final GrloRepo grloRepo;
    private final DogadjajRepo dogRepo;
    private final GrloService grloService;

    public TeljenjeController(GrloRepo grloRepo, DogadjajRepo dogRepo, GrloService grloService) {
        this.grloRepo = grloRepo;
        this.dogRepo = dogRepo;
        this.grloService = grloService;
    }

    /**
     * Lista teljenja u poslednjih N meseci (default 3). Vraća i teleBroj ako je već unet.
     */
    @GetMapping("/recent")
    public List<TeljenjeItemDTO> recent(@RequestParam(defaultValue = "3") int months,
                                        @RequestParam(value = "owner", required = false) String owner,
                                        Authentication auth) {
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        String korisnik = (isAdmin && owner != null && !owner.isBlank()) ? owner : auth.getName();

        LocalDate cutoff = LocalDate.now().minusMonths(Math.max(1, months));

        List<Grlo> grla = grloRepo.findByOwnerUsername(korisnik);
        List<TeljenjeItemDTO> out = new ArrayList<>();
        for (Grlo g : grla) {
            Dogadjaj lastTelj = dogRepo.findFirstByGrloIdAndTipOrderByDatumDesc(g.getId(), TipDogadjaja.TELJENJE);
            if (lastTelj == null) continue;
            if (lastTelj.getDatum() == null) continue;
            if (lastTelj.getDatum().isBefore(cutoff)) continue;
            out.add(new TeljenjeItemDTO(g.getId(), g.getBroj(), lastTelj.getDatum(), lastTelj.getTeleBroj()));
        }
        // sortiraj po datumu opadajuće
        out.sort((a, b) -> {
            if (a.datumTeljenja() == null && b.datumTeljenja() == null) return 0;
            if (a.datumTeljenja() == null) return 1;
            if (b.datumTeljenja() == null) return -1;
            return b.datumTeljenja().compareTo(a.datumTeljenja());
        });
        return out;
    }

    public static record ObradiTeljenjeReq(String teleBroj, Boolean mrtvo) {}
    public static record ObradiTeljenjeResp(Dogadjaj teljenje, Grlo tele) {}

    /**
     * Obrada teljenja:
     *  - ako je mrtvo=true: samo upisuje "X" u teleBroj i NE kreira novo grlo
     *  - inače: upisuje HB broj teleta i kreira novo grlo (tele)
     *    + pamti hbMajke i bikOtac (za genetiku)
     */
    @PostMapping("/{grloId}/obradi")
    public ObradiTeljenjeResp obradi(@PathVariable Long grloId,
                                     @RequestBody ObradiTeljenjeReq req,
                                     Authentication auth) {
        Grlo majka = grloRepo.findById(grloId).orElseThrow();

        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin && !majka.getOwnerUsername().equals(auth.getName())) {
            throw new RuntimeException("Nemaš pristup ovom grlu");
        }

        boolean mrtvo = req != null && Boolean.TRUE.equals(req.mrtvo());
        String teleBroj = (req == null) ? null : req.teleBroj();
        if (!mrtvo) {
            if (teleBroj == null || teleBroj.isBlank()) {
                throw new RuntimeException("Moraš uneti HB broj teleta");
            }
            teleBroj = teleBroj.trim();
        }

        Dogadjaj lastTelj = dogRepo.findFirstByGrloIdAndTipOrderByDatumDesc(grloId, TipDogadjaja.TELJENJE);
        if (lastTelj == null) {
            throw new RuntimeException("Nema teljenja za ovo grlo");
        }
        if (lastTelj.getDatum() == null) {
            throw new RuntimeException("Teljenje nema datum");
        }

        if (mrtvo) {
            // samo označi da je mrtvorođeno
            lastTelj.setTeleBroj("X");
            Dogadjaj savedTelj = dogRepo.save(lastTelj);
            return new ObradiTeljenjeResp(savedTelj, null);
        }

        // upiši teleBroj na teljenje
        lastTelj.setTeleBroj(teleBroj);
        Dogadjaj savedTelj = dogRepo.save(lastTelj);

        // pronađi poslednje osemenjavanje (bik) - za genetiku
        String bikOtac = null;
        var osList = dogRepo.findByGrloIdAndTipOrderByDatumDesc(grloId, TipDogadjaja.OSEMENJAVANJE);
        if (osList != null && !osList.isEmpty()) {
            // uzmi najskorije osemenjavanje koje je pre (ili na) datum teljenja
            for (Dogadjaj os : osList) {
                if (os.getDatum() == null) continue;
                if (!os.getDatum().isAfter(lastTelj.getDatum())) {
                    bikOtac = (os.getBik() == null || os.getBik().isBlank()) ? null : os.getBik().trim();
                    break;
                }
            }
        }

        // kreiraj tele kao novo grlo (laktacija=0, datumRodjenja=datumTeljenja)
        Grlo tele = new Grlo();
        tele.setBroj(teleBroj);
        tele.setDatumRodjenja(lastTelj.getDatum());
        tele.setLaktacija(0);
        tele.setPoslednjeTeljenje(null);
        tele.setOwnerUsername(majka.getOwnerUsername());
        tele.setHbMajke(majka.getBroj());
        tele.setBikOtac(bikOtac);

        Grlo savedTele = grloService.sacuvajGrlo(tele);

        return new ObradiTeljenjeResp(savedTelj, savedTele);
    }
}
