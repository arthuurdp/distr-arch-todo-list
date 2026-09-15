# syntax=docker/dockerfile:1
# Build context is the repository root (see docker-compose.yml), so the parent pom and shared libs are visible.

FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /workspace

COPY mvnw pom.xml ./
COPY .mvn .mvn
COPY libs libs
COPY services/notification-worker services/notification-worker
COPY services/api/pom.xml services/api/pom.xml

RUN --mount=type=cache,target=/root/.m2,sharing=locked \
    chmod +x mvnw && \
    ./mvnw -B -q -pl services/notification-worker -am package -DskipTests

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app

COPY --from=build /workspace/services/notification-worker/target/notification-worker-*.jar app.jar

USER app
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]
