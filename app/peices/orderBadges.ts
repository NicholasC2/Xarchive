import { Badge } from "@/lib/db";

export function orderBadges(badges: Badge[], badgeOrder: string[], isAdmin: boolean = false): Badge[] {
    return [
        ...(isAdmin ? [{
            id: "admin",
            name: "Administrator",
            icon: "/badges/admin.svg",
            createdAt: new Date(0),
            acquireBy: "",
            textColor: {
                className: "badge-color-red",
            },
        }] : []),

        ...badgeOrder
            .map(id => badges.find(badge => badge.id === id))
            .filter((badge): badge is NonNullable<typeof badge> => !!badge),

        ...badges.filter(
            badge => !badgeOrder.includes(badge.id)
        ),
    ];
}