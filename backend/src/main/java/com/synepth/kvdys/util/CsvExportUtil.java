package com.synepth.kvdys.util;

import java.util.List;

public class CsvExportUtil {

    public static final String UTF_8_BOM = "\uFEFF";

    public static String escapeCsvCell(Object value) {
        if (value == null) {
            return "";
        }
        String str = value.toString();
        if (str.contains(",") || str.contains("\"") || str.contains("\n") || str.contains("\r")) {
            return "\"" + str.replace("\"", "\"\"") + "\"";
        }
        return str;
    }

    public static String toCsvLine(List<?> cells) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < cells.size(); i++) {
            if (i > 0) {
                sb.append(",");
            }
            sb.append(escapeCsvCell(cells.get(i)));
        }
        sb.append("\r\n");
        return sb.toString();
    }
}
