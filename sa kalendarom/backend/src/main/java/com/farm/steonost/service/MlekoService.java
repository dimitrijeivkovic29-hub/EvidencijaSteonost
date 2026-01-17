package com.farm.steonost.service;

import com.farm.steonost.model.Dogadjaj;
import com.farm.steonost.model.Grlo;
import com.farm.steonost.model.TipDogadjaja;
import com.farm.steonost.repo.DogadjajRepo;
import com.farm.steonost.repo.GrloRepo;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@Service
public class MlekoService {
    private final GrloRepo grloRepo;
    private final DogadjajRepo dogRepo;

    public MlekoService(GrloRepo grloRepo, DogadjajRepo dogRepo) {
        this.grloRepo = grloRepo;
        this.dogRepo = dogRepo;
    }

    /**
     * Osnovno pravilo:
     *  - krava se muze ako ima bar jedno teljenje do datuma (>=1 laktacija)
     *  - i NIJE zasušena u tom momentu (tj. poslednji događaj između TELJENJE i ZASUSENJE do datuma nije ZASUSENJE)
     */
    public List<Grlo> osnovnaListaMuzeSe(String owner, LocalDate datum) {
        List<Grlo> grla = grloRepo.findByOwnerUsername(owner);
        List<Grlo> out = new ArrayList<>();
        for (Grlo g : grla) {
            if (g.getId() == null) continue;
            if (!imaTeljenjeDo(g.getId(), datum, g)) continue;
            if (jeZasusenaNaDatum(g.getId(), datum)) continue;
            out.add(g);
        }
        out.sort(Comparator.comparing(Grlo::getBroj, Comparator.nullsLast(String::compareTo)));
        return out;
    }

    public boolean imaTeljenjeDo(Long grloId, LocalDate datum, Grlo fallback) {
        // Brza provera preko polja, ali uzimamo u obzir i datum
        if (fallback != null && fallback.getPoslednjeTeljenje() != null && !fallback.getPoslednjeTeljenje().isAfter(datum)) {
            return true;
        }
        List<Dogadjaj> teljenja = dogRepo.findByGrloIdAndTipOrderByDatumDesc(grloId, TipDogadjaja.TELJENJE);
        for (Dogadjaj t : teljenja) {
            if (t.getDatum() == null) continue;
            if (!t.getDatum().isAfter(datum)) return true;
        }
        return false;
    }

    public boolean jeZasusenaNaDatum(Long grloId, LocalDate datum) {
        List<Dogadjaj> svi = dogRepo.findByGrloIdOrderByDatumDesc(grloId);
        Dogadjaj lastRelevant = null;
        for (Dogadjaj d : svi) {
            if (d.getDatum() == null) continue;
            if (d.getDatum().isAfter(datum)) continue;
            if (d.getTip() == TipDogadjaja.ZASUSENJE || d.getTip() == TipDogadjaja.TELJENJE) {
                lastRelevant = d;
                break;
            }
        }
        return lastRelevant != null && lastRelevant.getTip() == TipDogadjaja.ZASUSENJE;
    }

    public static Set<Long> parseCsvIds(String csv) {
        Set<Long> out = new HashSet<>();
        if (csv == null || csv.isBlank()) return out;
        for (String p : csv.split(",")) {
            String s = p.trim();
            if (s.isEmpty()) continue;
            try { out.add(Long.parseLong(s)); } catch (NumberFormatException ignored) {}
        }
        return out;
    }

    public static String toCsv(Collection<Long> ids) {
        if (ids == null || ids.isEmpty()) return null;
        return ids.stream().distinct().sorted().map(String::valueOf).reduce((a, b) -> a + "," + b).orElse(null);
    }
}
