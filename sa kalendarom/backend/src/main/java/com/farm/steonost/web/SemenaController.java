package com.farm.steonost.web;

import com.farm.steonost.dto.SemeStanjeDTO;
import com.farm.steonost.model.SemeStanje;
import com.farm.steonost.repo.SemeStanjeRepo;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/semena")
public class SemenaController {

    private final SemeStanjeRepo repo;

    public SemenaController(SemeStanjeRepo repo) {
        this.repo = repo;
    }

    public record AdjustRequest(String bik, Integer delta) {}

    @GetMapping
    public List<SemeStanjeDTO> list(){
        return repo.findAll().stream()
                .map(s -> new SemeStanjeDTO(s.getBik(), s.getKolicina()))
                .toList();
    }

    @PostMapping("/adjust")
    public SemeStanjeDTO adjust(@RequestBody AdjustRequest req){
        String bik = (req.bik() == null) ? "" : req.bik().trim();
        if(bik.isBlank()) throw new RuntimeException("Unesi bika.");
        int delta = (req.delta() == null) ? 0 : req.delta();
        if(delta == 0) throw new RuntimeException("Delta ne može biti 0.");

        SemeStanje s = repo.findByBik(bik).orElseGet(() -> new SemeStanje(bik, 0));
        s.setKolicina(s.getKolicina() + delta);
        repo.save(s);
        return new SemeStanjeDTO(s.getBik(), s.getKolicina());
    }
}
