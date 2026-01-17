package com.farm.steonost.dto;

import java.time.LocalDate;

public record TeljenjeItemDTO(
        Long grloId,
        String brojMajke,
        LocalDate datumTeljenja,
        String teleBroj
) {}
