package com.farm.steonost.web;

import com.farm.steonost.model.Grlo;
import com.farm.steonost.model.MlekoDnevno;
import com.farm.steonost.repo.GrloRepo;
import com.farm.steonost.repo.MlekoDnevnoRepo;
import com.farm.steonost.service.MlekoService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;

@RestController
@RequestMapping("/api/mleko")
public class MlekoController {

    private final MlekoDnevnoRepo mlekoRepo;
    private final GrloRepo grloRepo;
    private final MlekoService mlekoService;

    public MlekoController(MlekoDnevnoRepo mlekoRepo, GrloRepo grloRepo, MlekoService mlekoService) {
        this.mlekoRepo = mlekoRepo;
        this.grloRepo = grloRepo;
        this.mlekoService = mlekoService;
    }

    private String resolveOwner(Authentication auth, String ownerParam) {
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (isAdmin && ownerParam != null && !ownerParam.isBlank()) return ownerParam.trim();
        return auth.getName();
    }

    public static record SaveReq(LocalDate datum, Double litaraUkupno, Double litaraTelad) {}
    public static record OverridesReq(LocalDate datum, List<Long> includeIds, List<Long> excludeIds) {}

    public static record DayResp(
            LocalDate datum,
            double litaraUkupno,
            double litaraTelad,
            double netoLitara,
            int muzeSeBrojKrava,
            double prosekPoKravi,
            List<Long> includeIds,
            List<Long> excludeIds
    ) {}

    public static record CowItem(Long id, String broj, boolean defaultMuzeSe, boolean muzeSeFinal) {}

    public static record StatsDay(
            LocalDate datum,
            double litaraUkupno,
            double litaraTelad,
            double netoLitara,
            int muzeSeBrojKrava,
            double prosekPoKravi
    ) {}

    public static record MonthResp(
            String mesec,
            int danaUkupno,
            double avgUkupno,
            double avgPoKravi,
            List<StatsDay> dani
    ) {}

    @GetMapping("/day")
    public DayResp getDay(@RequestParam(required = false) String owner,
                          @RequestParam(required = false) LocalDate date,
                          Authentication auth) {
        String korisnik = resolveOwner(auth, owner);
        LocalDate datum = (date != null) ? date : LocalDate.now();

        MlekoDnevno m = mlekoRepo.findByOwnerUsernameAndDatum(korisnik, datum).orElse(null);
        double ukupno = m != null ? m.getLitaraUkupno() : 0.0;
        double telad = m != null ? m.getLitaraTelad() : 0.0;
        Set<Long> inc = (m != null) ? MlekoService.parseCsvIds(m.getIncludeIdsCsv()) : new HashSet<>();
        Set<Long> exc = (m != null) ? MlekoService.parseCsvIds(m.getExcludeIdsCsv()) : new HashSet<>();

        List<Grlo> base = mlekoService.osnovnaListaMuzeSe(korisnik, datum);
        Set<Long> baseIds = new HashSet<>();
        for (Grlo g : base) baseIds.add(g.getId());
        baseIds.addAll(inc);
        baseIds.removeAll(exc);

        int count = baseIds.size();
        // "Popilo telad" se DODAJE na količinu: ukupno proizvedeno = količina + telad
        double ukupnoProizvedeno = Math.max(0.0, ukupno + telad);
        double avg = count > 0 ? (ukupnoProizvedeno / count) : 0.0;

        return new DayResp(datum, ukupno, telad, ukupnoProizvedeno, count, avg,
                inc.stream().sorted().toList(), exc.stream().sorted().toList());
    }

    @PostMapping("/day")
    public DayResp saveDay(@RequestParam(required = false) String owner,
                           @RequestBody SaveReq req,
                           Authentication auth) {
        String korisnik = resolveOwner(auth, owner);
        if (req == null || req.datum() == null) throw new RuntimeException("Moraš uneti datum");

        double ukupno = req.litaraUkupno() == null ? 0.0 : req.litaraUkupno();
        double telad = req.litaraTelad() == null ? 0.0 : req.litaraTelad();
        if (ukupno < 0 || telad < 0) throw new RuntimeException("Litaraža ne može biti negativna");

        MlekoDnevno m = mlekoRepo.findByOwnerUsernameAndDatum(korisnik, req.datum()).orElseGet(MlekoDnevno::new);
        m.setOwnerUsername(korisnik);
        m.setDatum(req.datum());
        m.setLitaraUkupno(ukupno);
        m.setLitaraTelad(telad);
        mlekoRepo.save(m);

        return getDay(korisnik, req.datum(), auth);
    }

    @PostMapping("/overrides")
    public DayResp saveOverrides(@RequestParam(required = false) String owner,
                                 @RequestBody OverridesReq req,
                                 Authentication auth) {
        String korisnik = resolveOwner(auth, owner);
        if (req == null || req.datum() == null) throw new RuntimeException("Moraš uneti datum");

        MlekoDnevno m = mlekoRepo.findByOwnerUsernameAndDatum(korisnik, req.datum()).orElseGet(MlekoDnevno::new);
        m.setOwnerUsername(korisnik);
        m.setDatum(req.datum());
        Set<Long> inc = new HashSet<>(req.includeIds() == null ? List.of() : req.includeIds());
        Set<Long> exc = new HashSet<>(req.excludeIds() == null ? List.of() : req.excludeIds());
        // Ako je u oba, prednost ima exclude
        inc.removeAll(exc);
        m.setIncludeIdsCsv(MlekoService.toCsv(inc));
        m.setExcludeIdsCsv(MlekoService.toCsv(exc));
        mlekoRepo.save(m);

        return getDay(korisnik, req.datum(), auth);
    }

    @GetMapping("/muzeSe")
    public List<CowItem> listMuzeSe(@RequestParam(required = false) String owner,
                                   @RequestParam(required = false) LocalDate date,
                                   Authentication auth) {
        String korisnik = resolveOwner(auth, owner);
        LocalDate datum = (date != null) ? date : LocalDate.now();

        MlekoDnevno m = mlekoRepo.findByOwnerUsernameAndDatum(korisnik, datum).orElse(null);
        Set<Long> inc = (m != null) ? MlekoService.parseCsvIds(m.getIncludeIdsCsv()) : new HashSet<>();
        Set<Long> exc = (m != null) ? MlekoService.parseCsvIds(m.getExcludeIdsCsv()) : new HashSet<>();

        List<Grlo> all = grloRepo.findByOwnerUsername(korisnik);
        Set<Long> base = new HashSet<>();
        for (Grlo g : mlekoService.osnovnaListaMuzeSe(korisnik, datum)) base.add(g.getId());

        Set<Long> finalSet = new HashSet<>(base);
        finalSet.addAll(inc);
        finalSet.removeAll(exc);

        List<CowItem> out = new ArrayList<>();
        all.sort(Comparator.comparing(Grlo::getBroj, Comparator.nullsLast(String::compareTo)));
        for (Grlo g : all) {
            boolean def = base.contains(g.getId());
            boolean fin = finalSet.contains(g.getId());
            out.add(new CowItem(g.getId(), g.getBroj(), def, fin));
        }
        return out;
    }

    @GetMapping("/months")
    public List<String> months(@RequestParam(required = false) String owner,
                               Authentication auth) {
        String korisnik = resolveOwner(auth, owner);
        List<MlekoDnevno> all = mlekoRepo.findByOwnerUsernameOrderByDatumAsc(korisnik);
        Set<YearMonth> set = new HashSet<>();
        for (MlekoDnevno r : all) {
            if (r.getDatum() == null) continue;
            set.add(YearMonth.from(r.getDatum()));
        }
        List<YearMonth> months = new ArrayList<>(set);
        months.sort(Comparator.reverseOrder());
        List<String> out = new ArrayList<>();
        for (YearMonth ym : months) out.add(ym.toString()); // YYYY-MM
        return out;
    }

    @GetMapping("/month")
    public MonthResp month(@RequestParam String ym,
                           @RequestParam(required = false) String owner,
                           Authentication auth) {
        String korisnik = resolveOwner(auth, owner);
        if (ym == null || ym.isBlank()) throw new RuntimeException("Moraš uneti mesec (YYYY-MM)");
        YearMonth month = YearMonth.parse(ym.trim());
        LocalDate from = month.atDay(1);
        LocalDate to = month.atEndOfMonth();

        List<MlekoDnevno> list = mlekoRepo.findByOwnerUsernameAndDatumBetweenOrderByDatumAsc(korisnik, from, to);
        List<StatsDay> dani = new ArrayList<>();

        double sumUk = 0.0;
        double sumPo = 0.0;
        int cnt = 0;

        for (MlekoDnevno rec : list) {
            LocalDate d = rec.getDatum();
            if (d == null) continue;
            DayResp day = getDay(korisnik, d, auth);
            StatsDay sd = new StatsDay(day.datum(), day.litaraUkupno(), day.litaraTelad(), day.netoLitara(), day.muzeSeBrojKrava(), day.prosekPoKravi());
            dani.add(sd);
            sumUk += sd.netoLitara();
            sumPo += sd.prosekPoKravi();
            cnt++;
        }

        return new MonthResp(month.toString(), cnt,
                cnt > 0 ? (sumUk / cnt) : 0.0,
                cnt > 0 ? (sumPo / cnt) : 0.0,
                dani);
    }
}
