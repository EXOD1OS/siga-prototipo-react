SISTEMA DE GESTIÓN DE PLANIFICACIONES DOCENTES (PAAC / PAAD)
## Ámbito Institucional: DACEFyN – Universidad Nacional de La Rioja (UNLaR)


### 1. CONTEXTO ACADÉMICO Y MARCO NORMATIVO

El sistema digitaliza, audita y hace el seguimiento del circuito formal que deben cumplir las cátedras universitarias anualmente o cuatrimestralmente:
- **Carreras contempladas inicialmente:** Tecnicatura Universitaria en Informática (TUI), Ingeniería en Sistemas de Información (ISI) y Licenciatura en Sistemas de Información (LSI)[cite: 1].
- **Estructura Administrativa y Departamental:**
  - **Sede Capital:** Posee estructura departamental (`Sede Capital` -> `Departamento Exactas - DACEFyN` -> `Carreras: TUI, ISI, LSI` -> `Planes de Estudio` -> `Asignaturas` -> `Equipos de Cátedra`)[cite: 1].
  - **Sedes Regionales:** No poseen departamentos académicos; la jerarquía es directa (`Sede Regional` -> `Carreras` -> `Planes de Estudio` -> `Asignaturas` -> `Equipos de Cátedra`).
  - **Estructura Matricial:** Determinadas asignaturas de una carrera de Exactas están radicadas y son dictadas por otros departamentos (ej. *Derecho Informático y Ética Profesional* pertenece al plan de ISI pero está radicada en el Departamento de Ciencias Humanas)[cite: 1]. En estos casos, la planificación se deriva al departamento que gestiona la asignatura[cite: 1].
- **Planes Tradicionales vs. Competencias:**
  - **Planes Tradicionales (Ord. 171/19):** Contenidos temáticos mínimos, fundamentación, objetivos conceptuales, procedimentales y actitudinales[cite: 1, 3].
  - **Nuevos Planes (Ord. 448/11 y actualizados para ISI/LSI):** Exigen la formulación mediante **Matriz de Competencias** (Genéricas: CG5 a CG10; Específicas: CE1.1 a CE3.1, con niveles de aporte de 0 a 3, resultados de aprendizaje y descriptores)[cite: 1, 4].

---

### 2. ACTORES, ROLES Y MATRIZ DE RESPONSABILIDADES (RBAC)

1. **Profesor Responsable de Cátedra (Titular o a cargo):**
   - Es el responsable legal y pedagógico de la cátedra ante el departamento[cite: 1].
   - Confecciona y edita el **PAAC (Plan Anual de Actividades de Cátedra - Anexo II)**[cite: 1, 3].
   - Confecciona su propio **PAAD (Plan Anual de Actividades Docentes - Anexo III)**[cite: 1, 3].
   - Monitorea que todos los docentes del equipo completen sus respectivos PAAD[cite: 1].
   - Realiza el **envío unificado** a revisión (bloqueando la edición)[cite: 1].
   - Corrige los ítems observados por la UAP o la Dirección de Carrera y vuelve a enviar el paquete[cite: 1].

2. **Profesor Auxiliar (Asociado, Adjunto, JTP, Ayudante):**
   - Completa y edita **exclusivamente su propio PAAD individual**[cite: 1, 3].
   - Puede visualizar el PAAC de la cátedra en modo lectura colaborativa[cite: 1].
   - Corrige las observaciones puntuales dirigidas a su PAAD si fueron observadas[cite: 1].
   - Consulta el historial de sus planificaciones y resoluciones de años anteriores con fines de acreditación docente y concursos[cite: 1].

3. **UAP (Unidad de Asesoramiento Pedagógico):**
   - Área pedagógica única y transversal a todas las carreras del departamento[cite: 1].
   - Evalúa aspectos pedagógicos, curriculares, articulación de correlativas y metodologías de evaluación[cite: 1, 3].
   - Confecciona el **Informe Pedagógico (Anexo III - Ord. 219/22)**[cite: 1].
   - Emite observaciones a nivel de campo puntual en PAAC o PAADs[cite: 1].
   - Emite la **Aprobación Pedagógica Parcial**[cite: 1].
   - Co-elabora el **Informe General de PAAC (Anexo V - Ord. 219/22)** en conjunto con la Dirección de Carrera[cite: 1].

4. **Dirección de Carrera (ISI / LSI / TUI):**
   - Existe una dirección por cada carrera y solo tiene acceso y visualización sobre las materias de su carrera[cite: 1].
   - Evalúa la correspondencia con los contenidos mínimos del plan de estudios, bibliografía y trabajos prácticos[cite: 1].
   - Verifica la presentación del PAAD de cada docente del equipo de cátedra[cite: 1].
   - Confecciona el **Informe Disciplinar (Anexo IV - Ord. 219/22)**[cite: 1].
   - Emite la **Aprobación Disciplinar Parcial**[cite: 1].
   - Emite observaciones específicas por ítem disciplinar[cite: 1].
   - Consolida el **Informe General de PAAC (Anexo V)** y redacta la **Nota de Elevación (Anexo II - Ord. 219/22)** hacia el Consejo Departamental[cite: 1].

5. **Consejo Departamental (DACEFyN):**
   - Máximo órgano de gobierno departamental[cite: 1].
   - Audita el paquete consolidado (PAAC + PAADs + Informes III, IV y V + Nota de Elevación II)[cite: 1].
   - Emite dictamen de aprobación institucional, asignando el **Número de Expediente** y el **Número de Resolución formal**[cite: 1].
   - Con estos dos datos, la planificación pasa formalmente al estado **FINALIZADO**[cite: 1].

6. **Administrador del Sistema:**
   - Gestiona usuarios: Alta de docentes y autoridades[cite: 1]. Los usuarios se aprovisionan con DNI como usuario y contraseña provisional, obligando a cambiar la clave en el primer inicio de sesión.
   - Gestiona la estructura: Sedes, Departamentos, Carreras, Planes de estudio y Asignaturas[cite: 1].
   - Configuración de Equipos de Cátedra por Ciclo Lectivo: Asigna integrantes, roles (*Titular, Asociado, Adjunto, JTP, Ayudante*) y selecciona al Docente Responsable[cite: 1].
   - Automatización de ciclos lectivos: Apertura de 1° Cuatrimestre (crea instancias para materias Anuales y de 1C) o 2° Cuatrimestre (materias de 2C), instanciando los PAAC y PAAD correspondientes en estado `BORRADOR`[cite: 1].


7. **Diagrama de base de datos:**
erDiagram
    DEPARTAMENTOS ||--o{ CARRERAS : administra_en_capital
    DEPARTAMENTOS ||--o{ ASIGNATURAS : radica_matricial_capital
    CARRERAS ||--|{ CARRERAS_SEDES : dicta_en
    SEDES ||--|{ CARRERAS_SEDES : hospeda
    CARRERAS ||--o{ PLANES_ESTUDIO : ofrece
    CARRERAS ||--o{ USUARIOS : asigna_director
    PLANES_ESTUDIO ||--|{ ASIGNATURAS : contiene

    CICLOS_LECTIVOS ||--|{ PERIODOS_ACADEMICOS : divide
    CICLOS_LECTIVOS ||--o{ EQUIPOS_CATEDRA : planta_anual
    ASIGNATURAS ||--|{ EQUIPOS_CATEDRA : conforma
    USUARIOS ||--|{ EQUIPOS_CATEDRA : asigna_docente

    PERIODOS_ACADEMICOS ||--o{ PLANIFICACIONES : agrupa_1C_2C
    ASIGNATURAS ||--o{ PLANIFICACIONES : genera
    USUARIOS ||--o{ PLANIFICACIONES : docente_responsable

    PLANIFICACIONES ||--|| PAAC : posee_un_paac
    PAAC ||--o{ PAAC_COMPETENCIAS : matriz_competencias

    PLANIFICACIONES ||--|{ PAAD_DOCENTES : agrupa_paads
    USUARIOS ||--|{ PAAD_DOCENTES : completa_profesor

    PLANIFICACIONES ||--o| INFORMES_PEDAGOGICOS : evalua_uap
    USUARIOS ||--o{ INFORMES_PEDAGOGICOS : auditor_uap

    PLANIFICACIONES ||--o| INFORMES_DISCIPLINARES : evalua_direccion
    USUARIOS ||--o{ INFORMES_DISCIPLINARES : auditor_director

    PLANIFICACIONES ||--o| INFORMES_GENERALES_PAAC : consolida_anexo_v

    PAAC ||--o{ OBSERVACIONES_ITEMS : campo_paac
    PAAD_DOCENTES ||--o{ OBSERVACIONES_ITEMS : campo_paad
    USUARIOS ||--o{ OBSERVACIONES_ITEMS : emite_auditor

    SEDES {
        uuid id PK
        varchar nombre
        boolean es_capital
    }

    DEPARTAMENTOS {
        uuid id PK
        varchar nombre
    }

    CARRERAS {
        uuid id PK
        uuid departamento_id_nullable FK
        varchar nombre
        varchar codigo UK
    }

    CARRERAS_SEDES {
        uuid id PK
        uuid carrera_id FK
        uuid sede_id FK
    }

    PLANES_ESTUDIO {
        uuid id PK
        uuid carrera_id FK
        varchar ordenanza
        varchar enfoque
        boolean activo
    }

    ASIGNATURAS {
        uuid id PK
        uuid plan_estudio_id FK
        uuid departamento_radicacion_nullable FK
        varchar nombre
        int ano_cursada
        varchar regimen_dictado
        int horas_semanales
        int horas_totales
        text contenidos_minimos
    }

    CICLOS_LECTIVOS {
        int ano_lectivo PK
        date fecha_inicio
        date fecha_fin
        boolean activo
    }

    PERIODOS_ACADEMICOS {
        uuid id PK
        int ciclo_lectivo FK
        varchar tipo_periodo
        varchar alcance_materias
        date fecha_limite_presentacion
        date fecha_limite_informes
    }

    USUARIOS {
        uuid id PK
        varchar email UK
        varchar password_hash
        varchar nombre
        varchar apellido
        varchar rol
        uuid carrera_id FK
    }

    EQUIPOS_CATEDRA {
        uuid id PK
        uuid asignatura_id FK
        uuid docente_id FK
        int ciclo_lectivo FK
        varchar cargo
        boolean es_responsable
    }

    PLANIFICACIONES {
        uuid id PK
        uuid periodo_academico_id FK
        uuid asignatura_id FK
        uuid docente_responsable_id FK
        varchar estado
        varchar numero_expediente
        varchar numero_resolucion
        timestamp fecha_aprobacion_cd
        timestamp updated_at
    }

    PAAC {
        uuid id PK
        uuid planificacion_id FK
        jsonb datos_encabezado
        jsonb fundamentacion_diagnostico
        jsonb objetivos_generales
        jsonb metodologia_ensenanza
        jsonb evaluacion_regimen
        jsonb trabajos_practicos
        jsonb bibliografia
        jsonb distribucion_horaria
        varchar estado_elaboracion
    }

    PAAC_COMPETENCIAS {
        uuid id PK
        uuid paac_id FK
        varchar tipo_competencia
        text descripcion_competencia
        int nivel_aporte
        jsonb descriptores_aprendizaje
    }

    PAAD_DOCENTES {
        uuid id PK
        uuid planificacion_id FK
        uuid docente_id FK
        varchar cargo_en_catedra
        jsonb docencia_directa
        jsonb capacitacion
        jsonb formacion_rrhh
        jsonb investigacion_extension
        varchar estado_presentacion
        timestamp updated_at
    }

    INFORMES_PEDAGOGICOS {
        uuid id PK
        uuid planificacion_id FK
        uuid auditor_uap_id FK
        jsonb aspectos_generales
        jsonb aspectos_curriculares
        varchar dictamen
        text observaciones_generales
        timestamp fecha_emision
    }

    INFORMES_DISCIPLINARES {
        uuid id PK
        uuid planificacion_id FK
        uuid director_carrera_id FK
        varchar contenidos_minimos
        varchar trabajos_practicos
        varchar bibliografia
        jsonb control_individual_paad
        varchar dictamen
        text observaciones_disciplinares
        timestamp fecha_emision
    }

    INFORMES_GENERALES_PAAC {
        uuid id PK
        uuid planificacion_id FK
        varchar docente_responsable_nombre
        varchar cargo_docente
        varchar estado_paac
        varchar estado_paad
        varchar estado_global
        text observaciones_generales
        timestamp fecha_elaboracion
    }

    OBSERVACIONES_ITEMS {
        uuid id PK
        uuid paac_id FK
        uuid paad_docente_id FK
        varchar campo_path
        uuid autor_id FK
        varchar rol_autor
        text mensaje
        boolean resuelto
        timestamp created_at
    }