package com.farm.steonost.dto;

import java.time.LocalDate;
import java.util.Map;

/**
 * Jednostavan pregled genetike na osnovu "bikOtac" polja na grlima.
 */
public record GenetikaDTO(
        String vlasnik,
        LocalDate generisano,
        int ukupnoGrla,
        int saPoznatimBikom,
        Map<String, Integer> poBiku
) {}
