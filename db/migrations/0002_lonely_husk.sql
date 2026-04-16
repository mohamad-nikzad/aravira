CREATE INDEX "appointments_staff_id_date_idx" ON "appointments" USING btree ("staff_id","date");--> statement-breakpoint
CREATE INDEX "appointments_client_id_date_idx" ON "appointments" USING btree ("client_id","date");
