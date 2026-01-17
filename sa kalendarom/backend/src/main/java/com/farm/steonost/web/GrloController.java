package com.farm.steonost.web;

import com.farm.steonost.dto.GrloListItemDTO;
import com.farm.steonost.model.Grlo;
import com.farm.steonost.repo.DogadjajRepo;
import com.farm.steonost.repo.GrloRepo;
import com.farm.steonost.service.GrloService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/grla")
public class GrloController {

    private final GrloService service;
    private final GrloRepo grloRepo;
    private final DogadjajRepo dogRepo;

    public GrloController(GrloService service, GrloRepo grloRepo, DogadjajRepo dogRepo) {
        this.service = service;
        this.grloRepo = grloRepo;
        this.dogRepo = dogRepo;
    }

    @GetMapping
    public List<GrloListItemDTO> moja(@RequestParam(value = "owner", required = false) String owner,
                                      Authentication auth) {
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        String korisnik = (isAdmin && owner != null && !owner.isBlank()) ? owner : auth.getName();
        return service.mojaGrla(korisnik).stream().map(service::mapiraj).toList();
    }

    @PostMapping
    public Grlo kreiraj(@RequestBody Grlo input, Authentication auth) {
        input.setOwnerUsername(auth.getName());
        return service.sacuvajGrlo(input);
    }

    @GetMapping("/{id}")
    public Grlo jedan(@PathVariable Long id, Authentication auth) {
        Grlo g = grloRepo.findById(id).orElseThrow();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin && !g.getOwnerUsername().equals(auth.getName())) {
            throw new RuntimeException("Nemaš pristup");
        }
        return g;
    }

    @PutMapping("/{id}")
    public Grlo izmeni(@PathVariable Long id, @RequestBody Grlo input, Authentication auth) {
        Grlo g = grloRepo.findById(id).orElseThrow();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin && !g.getOwnerUsername().equals(auth.getName())) {
            throw new RuntimeException("Nemaš pristup");
        }
        g.setBroj(input.getBroj());
        g.setDatumRodjenja(input.getDatumRodjenja());
        g.setLaktacija(input.getLaktacija());
        g.setPoslednjeTeljenje(input.getLaktacija() > 0 ? input.getPoslednjeTeljenje() : null);
        return service.sacuvajGrlo(g);
    }

    @Transactional
@DeleteMapping("/{id}")
    public void obrisi(@PathVariable Long id, Authentication auth) {
        Grlo g = grloRepo.findById(id).orElseThrow();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin && !g.getOwnerUsername().equals(auth.getName())) {
            throw new RuntimeException("Nemaš pristup");
        }
       
        dogRepo.deleteByGrloId(id);
        grloRepo.delete(g);
    }
}
