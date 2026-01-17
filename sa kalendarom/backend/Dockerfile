FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY . .
RUN mvn -DskipTests clean package spring-boot:repackage

# napravi app.jar tako da UZME boot jar, a ne original-*.jar
RUN set -eux; \
  JAR="$(ls -1 target/*.jar | grep -v 'original-' | head -n 1)"; \
  echo "Using jar: $JAR"; \
  cp "$JAR" /app/app.jar

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/app.jar app.jar
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
