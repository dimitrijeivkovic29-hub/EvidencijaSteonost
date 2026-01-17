package com.farm.steonost.dto;

import java.time.LocalDate;

public record GrloListItemDTO(
        Long id,
        String broj,
        LocalDate datumRodjenja,
        int laktacija,
        LocalDate poslednjeTeljenje,
        long danaOdOsemenjavanja,
        long danaOdPoslednjegTeljenja,
        boolean steona,
        int brojOsemenjavanja,
        String status
) {}
