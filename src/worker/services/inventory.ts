export interface ReservationRow {
  variant_id: number;
  qty: number;
}

export async function getActiveReservations(
  db: D1Database,
  orderId: number,
): Promise<ReservationRow[]> {
  const result = await db
    .prepare(
      "SELECT variant_id, qty FROM inventory_reservations WHERE order_id = ? AND status = 'active'",
    )
    .bind(orderId)
    .all<ReservationRow>();
  return result.results ?? [];
}

export function releaseStatements(
  db: D1Database,
  orderId: number,
  reservations: ReservationRow[],
  now: number,
): D1PreparedStatement[] {
  const statements: D1PreparedStatement[] = [];
  for (const reservation of reservations) {
    statements.push(
      db
        .prepare(
          `UPDATE inventory SET reserved = reserved - ?, updated_at = ?
           WHERE variant_id = ? AND reserved >= ?`,
        )
        .bind(reservation.qty, now, reservation.variant_id, reservation.qty),
    );
    statements.push(
      db
        .prepare(
          `UPDATE inventory_reservations SET status = 'released'
           WHERE order_id = ? AND variant_id = ? AND status = 'active'`,
        )
        .bind(orderId, reservation.variant_id),
    );
  }
  return statements;
}

export function confirmStatements(
  db: D1Database,
  orderId: number,
  reservations: ReservationRow[],
  now: number,
): D1PreparedStatement[] {
  const statements: D1PreparedStatement[] = [];
  for (const reservation of reservations) {
    statements.push(
      db
        .prepare(
          `UPDATE inventory SET on_hand = on_hand - ?, reserved = reserved - ?, updated_at = ?
           WHERE variant_id = ? AND on_hand >= ? AND reserved >= ?`,
        )
        .bind(
          reservation.qty,
          reservation.qty,
          now,
          reservation.variant_id,
          reservation.qty,
          reservation.qty,
        ),
    );
    statements.push(
      db
        .prepare(
          `UPDATE inventory_reservations SET status = 'confirmed'
           WHERE order_id = ? AND variant_id = ? AND status = 'active'`,
        )
        .bind(orderId, reservation.variant_id),
    );
  }
  return statements;
}
