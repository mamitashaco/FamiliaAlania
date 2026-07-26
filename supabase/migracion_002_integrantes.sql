-- Permite mantener una sola ficha laboral y financiera vigente por integrante.
create unique index if not exists uq_tb_informacion_laboral_integrante
  on tb_informacion_laboral(integrante_id);
create unique index if not exists uq_tb_cuentas_financieras_integrante
  on tb_cuentas_financieras(integrante_id);
