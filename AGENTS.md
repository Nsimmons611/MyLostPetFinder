# MyLostPetFinder Agent Guide

## Project Purpose

This repository is a two-part web app for reuniting lost pets with their owners:

- Owners can create an account, register pets, and report one of their pets as lost.
- Finders can report a sighting, optionally with a photo and map location.
- The app shows active lost pets in a list and on a map, and each lost-pet detail page shows candidate sightings ranked by an image-similarity match score.

The current implementation is strongest as a local prototype centered on lost-pet reporting, sightings, and map-based location capture.

## Project Background

This repository supports the Applied Project document `Lost Pet Tracker` by Nehemiah Simmons dated March 3, 2026.

The documented project goal is broader than generic pet CRUD:

- Owners register pets and mark them lost with images and last-seen locations.
- Community members submit sightings with photos and context.
- The system compares lost-pet images against sighting images to rank possible matches and help reunite pets with owners faster.

Important framing for future agents:

- The codebase is the prototype implementation of that vision.
- The current repo already supports much of the owner/finder workflow.
- The AI matching flow now exists in lightweight prototype form and should still be described as basic image ranking rather than production-grade recognition.

## Tech Stack

- Frontend: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Leaflet, React-Leaflet
- Backend: Django 6, Django REST Framework, Simple JWT auth, PostgreSQL
- Mapping and geocoding: OpenStreetMap tiles, Leaflet, Nominatim geocoding endpoint
- Media: Django `ImageField` uploads stored under `Backend/pet_photos/`

Planned architecture from the project document:

- AI engine: implemented as a lightweight ImageNet-pretrained `ResNet18` feature extractor with cosine similarity scoring
- Image processing: Pillow for initial image handling
- Authentication: JWT-based access for secure role-aware workflows

## Repository Layout

- `Frontend/`: Next.js client app
- `Backend/`: Django project
- `Backend/pets/`: main backend domain app
- `Backend/webapp/`: mostly scaffold leftovers; only `home` view is used
- `start-app.bat`: legacy local startup helper with hard-coded absolute paths from the original developer machine

## Core Domain Model

Defined in `Backend/pets/models.py`.

- `Pet`: an owned pet profile tied to a Django user
- `LostPet`: an active or resolved lost-pet report; may reference a `Pet`
- `Sighting`: a finder-reported sighting, optionally linked to a `LostPet`
- `Match`: stores a score between a `LostPet` and `Sighting`

Important relationships:

- A user owns many `Pet` records
- A user can create many `LostPet` reports
- A `LostPet` can point back to an owned `Pet`
- A `LostPet` has many `Sighting` and `Match` records

Important implementation detail:

- `LostPet` does not store its own uploaded photo. The serializer exposes `photo` by reading `lost_pet.pet.photo` if the lost report is linked to a registered pet.

## Intended User Groups

The project write-up describes three primary audiences:

- Pet owners: register pets, report pets lost, and review candidate matches
- Finders or community members: report sightings with as little friction as possible
- Shelter staff: compare found animals or intake cases against active lost-pet reports

Implementation note:

- Owners and finders are represented in the current code.
- Shelter staff workflows are part of the project scope, but there is no distinct shelter dashboard or role implementation in the repo yet.

## Main User Flows

### Owner Flow

1. Sign up at `/signup`
2. Log in at `/login`
3. Register a pet at `/pets/register`
4. View owned pets at `/pets/my-pets`
5. Report one pet as lost from `/pets/report/[petId]`
6. Review public lost-pet entries on `/`
7. Mark a lost report as found from `/pets/my-pets`

### Finder Flow

1. Open `/`
2. Report a sighting from `/report`
3. Click a map location and optionally upload a photo
4. Submit even without authentication; the backend assigns sightings from unauthenticated users to a shared `anonymous` user

### Public Browse Flow

1. Home page fetches active lost pets from `GET /api/lostpets/`
2. Home page fetches all sightings from `GET /api/sightings/`
3. Pins with coordinates are displayed on the Leaflet map
4. Clicking a lost pet opens `/pets/[id]`
5. The detail page calls `GET /api/lostpets/<id>/top-matches/`

## Intended Functional Workflow

The project document describes the desired end-to-end workflow as:

1. Data entry: a user submits a pet profile or sighting with photo, location, and time
2. Feature extraction: the system derives an image representation or embedding
3. Similarity analysis: the system compares the new image against stored records
4. Match ranking: the system returns the highest-confidence candidates
5. Resolution: the owner reviews likely matches until the case is marked found

Current implementation note:

- Steps 1, 4, and part of 5 exist in prototype form.
- Steps 2 and 3 now exist in lightweight form: `Backend/pets/imageMatching.py` extracts pretrained image features and ranks candidates with cosine similarity.
- If the lost pet has no linked `Pet`, if the linked `Pet` has no photo, or if the sighting has no photo, the current matcher returns `0.0`.

## Frontend Route Map

Primary routes in `Frontend/app/`:

- `/`: homepage with active lost pets and map
- `/login`: JWT login form
- `/signup`: account creation
- `/report`: main sighting report page
- `/pets/register`: register owned pet
- `/pets/my-pets`: owner dashboard for registered pets and lost reports
- `/pets/report/[petId]`: report one owned pet as lost
- `/pets/[id]`: lost-pet detail page with match results

Legacy or duplicate routes still in the repo:

- `/pets/report`: standalone lost-pet reporting form not tied to an owned pet
- `/pets/sighting`: older sighting form that expects authenticated use and includes a `confidence` field the backend no longer stores

Treat those duplicate routes as likely prototype leftovers unless the user explicitly wants them preserved.

## Backend API Surface

Defined mostly in `Backend/pets/views.py` and `Backend/pets/urls.py`.

### Authentication

- `POST /api/signup/`: create a user and return JWT tokens
- `POST /api/token/`: obtain JWT access and refresh token
- `POST /api/token/refresh/`: refresh access token

### Owned Pets

- `GET, POST /api/owned-pets/`: list or create the current user's pets
- `GET, PUT, PATCH, DELETE /api/owned-pets/<id>/`: manage one owned pet

### Lost Pets

- `GET /api/lostpets/`: public list of active lost pets only (`is_found=False`)
- `POST /api/lostpets/`: authenticated create
- `GET /api/lostpets/<id>/`: public detail
- `PUT, PATCH, DELETE /api/lostpets/<id>/`: owner-only changes
- `GET /api/my-lost-pets/`: current user's lost reports
- `GET, PUT, PATCH, DELETE /api/my-lost-pets/<id>/`: current user's lost report

### Sightings

- `GET, POST /api/sightings/`: public list and open sighting creation
- `GET, PUT, PATCH, DELETE /api/sightings/<id>/`: authenticated reporter-only detail/edit/delete

### Matching and Utilities

- `GET /api/lostpets/<id>/top-matches/`: compute and return top 5 sighting matches
- `GET, POST /api/matches/`: authenticated access
- `GET, PUT, PATCH /api/matches/<id>/`: intended authenticated access, but the detail view is incomplete
- `POST /api/geocode/`: geocode a text location through Nominatim

## Current Frontend Data Expectations

The frontend expects camelCase API fields produced by the serializers, for example:

- `petType`
- `locationLost`
- `dateLost`
- `dateSighted`
- `isFound`
- `createdAt`
- `updatedAt`

Frontend auth pattern:

- Access token is stored in `localStorage` under `token`
- Requests include `Authorization: Bearer <token>` when needed
- There is no centralized auth client or refresh-token handling in the frontend

## Important Files

- `Backend/pets/models.py`: source of truth for data model
- `Backend/pets/serializers.py`: API response shape and camelCase mapping
- `Backend/pets/views.py`: permissions, CRUD behavior, signup, geocoding, matching
- `Backend/pets/imageMatching.py`: ResNet18-based feature extraction and cosine-similarity scorer
- `Backend/myApp/settings.py`: database, JWT, CORS, media config
- `Frontend/app/page.tsx`: homepage and public list/map
- `Frontend/app/pets/[id]/page.tsx`: lost-pet detail and top-match UI
- `Frontend/app/pets/my-pets/page.tsx`: owner dashboard
- `Frontend/app/report/page.tsx`: main sighting report form
- `Frontend/app/pets/report/[petId]/page.tsx`: report owned pet as lost
- `Frontend/app/components/Map.tsx`: public map view
- `Frontend/app/components/InteractiveMap.tsx`: click-to-place map input

## Setup and Local Run Notes

### Frontend

From `Frontend/`:

```powershell
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`.

### Backend

From `Backend/`:

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers psycopg[binary] pillow requests torch torchvision
python manage.py migrate
python manage.py runserver
```

Backend is configured for PostgreSQL at `127.0.0.1:5432` using database `lostPetDb`.

Matching runtime note:

- On this machine, the image-matching stack was installed under local Python `3.11` because `torch` and `torchvision` are much more practical there than under Python `3.14`.
- If matching imports fail, verify the backend is running in the Python environment that contains `torch`, `torchvision`, and `Pillow`.

### Media

- `MEDIA_URL = /pet_photos/`
- `MEDIA_ROOT = pet_photos/`
- Uploaded files are served by Django in debug mode

## Known Gaps and Risks

These are the first things an agent should sanity-check before making feature changes.

- `start-app.bat` is not portable. It uses hard-coded absolute paths from another machine.
- `Backend/myApp/settings.py` contains committed development secrets and database credentials.
- No backend `requirements.txt` or lockfile is present.
- `Backend/pets/views.py` has an incomplete `MatchDetail` view with no queryset, so the match detail endpoint is likely broken.
- `/pets/report` and `/pets/sighting` look like older duplicate routes and may drift from the current UX.
- The older `/pets/sighting` page still sends a `confidence` field, but the current `Sighting` model no longer has that field.
- Frontend fetch URLs are hard-coded to `http://127.0.0.1:8000`; there is no environment-based API config.
- JWT refresh flow is not wired into the frontend.
- Tests are effectively absent in both Django apps.
- `webapp` is mostly unused scaffold code.
- The homepage text and map defaults are Georgia-specific (`Rome, Georgia`, center around Georgia), so geographic scope is currently localized.
- The project write-up mentions shelter staff workflows and automated owner notification behavior, but those do not yet appear as implemented product features in the repo.
- The current matching implementation is suitable for a school-project prototype, but it is still basic ranking rather than a calibrated production identification system.
- The matching stack depends on `torch`, `torchvision`, and `Pillow`, so backend environment consistency matters more now than before.

## Suggested Agent Working Assumptions

- Treat `Backend/pets/` and `Frontend/app/` as the real product surface.
- Prefer `/report` and `/pets/report/[petId]` over the older duplicate routes.
- Assume the project is in prototype stage and prioritize correctness, cleanup, and consolidation over premature abstraction.
- Preserve the distinction between documented product intent and currently implemented behavior.
- If adding features, consider whether they belong to owner workflows, finder workflows, or the public browse experience.
- Keep shelter-staff requirements in mind when making architectural choices, even though that role is not implemented yet.
- If modifying API payloads, verify the camelCase serializer contract because the frontend depends on it directly.
- If touching auth, plan for token refresh and a centralized API helper.
- If touching matching, preserve the current missing-photo behavior and the `0.0` to `1.0` score contract used by the frontend.

## Recommended Next Cleanup Targets

1. Add backend dependency management and environment-based settings.
2. Replace hard-coded frontend API URLs with environment variables.
3. Decide whether to keep or remove duplicate legacy routes.
4. Implement real tests for critical API flows.
5. Improve or calibrate the current ResNet18-based matching logic if higher-quality ranking is needed.
6. Harden auth and ownership checks around related resources.

## Quick Summary

This repo is a Next.js plus Django lost-pet tracker prototype where owners register pets and report them lost, while finders submit sightings with map coordinates and optional photos. The main backend logic lives in `Backend/pets`, the main frontend lives in `Frontend/app`, and the most important current caveats are environment/config hygiene, duplicated prototype routes, basic prototype-level image matching, and limited test coverage.
