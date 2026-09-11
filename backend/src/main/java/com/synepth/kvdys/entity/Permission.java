package com.synepth.kvdys.entity;

import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Set;

public final class Permission {

    private Permission() {}

    // Administration
    public static final String USERS_MANAGE = "USERS_MANAGE";
    public static final String DEPARTMENTS_MANAGE = "DEPARTMENTS_MANAGE";
    public static final String ROLES_MANAGE = "ROLES_MANAGE";

    // Assets
    public static final String ASSETS_VIEW_ALL = "ASSETS_VIEW_ALL";
    public static final String ASSETS_MANAGE = "ASSETS_MANAGE";
    public static final String ASSETS_DELETE = "ASSETS_DELETE";
    public static final String CATEGORIES_MANAGE = "CATEGORIES_MANAGE";

    // Support Tickets
    public static final String TICKETS_VIEW_ALL = "TICKETS_VIEW_ALL";
    public static final String TICKETS_MANAGE = "TICKETS_MANAGE";
    public static final String TICKETS_CREATE = "TICKETS_CREATE";

    // Reporting
    public static final String REPORTS_EXPORT = "REPORTS_EXPORT";

    public static final Set<String> ALL;

    static {
        Set<String> set = new LinkedHashSet<>();
        set.add(USERS_MANAGE);
        set.add(DEPARTMENTS_MANAGE);
        set.add(ROLES_MANAGE);
        set.add(ASSETS_VIEW_ALL);
        set.add(ASSETS_MANAGE);
        set.add(ASSETS_DELETE);
        set.add(CATEGORIES_MANAGE);
        set.add(TICKETS_VIEW_ALL);
        set.add(TICKETS_MANAGE);
        set.add(TICKETS_CREATE);
        set.add(REPORTS_EXPORT);
        ALL = Collections.unmodifiableSet(set);
    }
}
