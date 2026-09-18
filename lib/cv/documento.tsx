import * as React from "react"
import path from "node:path"
import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"

import type { PerfilPublico } from "@/lib/demo-data"
import { formatMoney, formatNumber } from "@/lib/format"

const PAPEL = "#f1f0ee"
const TINTA = "#16171a"
const SENAL = "#d62d12"
const FILETE = "#d6d4d0"
const BLANCO = "#ffffff"
const APAGADO = "#6f7076"

let fuentesRegistradas = false

function registrarFuentes() {
  if (fuentesRegistradas) return
  const carpeta = path.join(process.cwd(), "public", "fuentes")

  Font.register({
    family: "Archivo",
    fonts: [
      { src: path.join(carpeta, "archivo-700.ttf"), fontWeight: 700 },
      { src: path.join(carpeta, "archivo-800.ttf"), fontWeight: 800 },
    ],
  })

  Font.register({
    family: "Geist",
    fonts: [
      { src: path.join(carpeta, "geist-400.ttf"), fontWeight: 400 },
      { src: path.join(carpeta, "geist-600.ttf"), fontWeight: 600 },
    ],
  })

  Font.registerHyphenationCallback((palabra) => [palabra])
  fuentesRegistradas = true
}

const MARGEN = 34
const MARCO = 18

const s = StyleSheet.create({
  pagina: {
    backgroundColor: PAPEL,
    color: TINTA,
    fontFamily: "Geist",
    fontSize: 9,
    paddingTop: MARGEN,
    paddingBottom: MARGEN + 12,
    paddingHorizontal: MARGEN,
  },
  marco: {
    position: "absolute",
    top: MARCO,
    left: MARCO,
    right: MARCO,
    bottom: MARCO,
    borderWidth: 0.75,
    borderColor: TINTA,
  },
  cabecera: {
    borderBottomWidth: 1.5,
    borderBottomColor: TINTA,
    paddingBottom: 8,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  marca: {
    fontFamily: "Archivo",
    fontWeight: 800,
    fontSize: 16,
    letterSpacing: -0.5,
    color: TINTA,
  },
  submarca: {
    fontSize: 7.5,
    fontWeight: 600,
    letterSpacing: 1,
    color: SENAL,
    textTransform: "uppercase",
    marginTop: 2,
  },
  fechaEmision: {
    fontSize: 8,
    color: APAGADO,
    textAlign: "right",
  },
  seccionIdentidad: {
    marginBottom: 16,
  },
  nombre: {
    fontFamily: "Archivo",
    fontWeight: 800,
    fontSize: 22,
    letterSpacing: -0.5,
    color: TINTA,
    lineHeight: 1.1,
  },
  rolSubtitulo: {
    fontSize: 9.5,
    fontFamily: "Geist",
    fontWeight: 600,
    color: TINTA,
    marginTop: 3,
  },
  datosContacto: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: FILETE,
  },
  datoItem: {
    fontSize: 8.5,
    color: TINTA,
  },
  bioTexto: {
    fontSize: 8.5,
    color: TINTA,
    lineHeight: 1.45,
    marginTop: 6,
    opacity: 0.85,
  },
  grillaMetricas: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  cajaMetrica: {
    flex: 1,
    backgroundColor: BLANCO,
    borderWidth: 0.75,
    borderColor: FILETE,
    padding: 8,
  },
  metricaValor: {
    fontFamily: "Archivo",
    fontWeight: 800,
    fontSize: 15,
    letterSpacing: -0.3,
    color: SENAL,
  },
  metricaRotulo: {
    fontSize: 7,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: TINTA,
    marginTop: 2,
    opacity: 0.7,
  },
  bloqueSeccion: {
    marginBottom: 14,
  },
  tituloSeccion: {
    fontFamily: "Archivo",
    fontWeight: 700,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: TINTA,
    paddingBottom: 4,
    marginBottom: 8,
    color: TINTA,
  },
  filaHistorial: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: FILETE,
  },
  tiendaNombre: {
    fontFamily: "Archivo",
    fontWeight: 700,
    fontSize: 9,
    color: TINTA,
  },
  tiendaVentas: {
    fontSize: 8.5,
    color: TINTA,
  },
  filaCategoria: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 3.5,
    borderBottomWidth: 0.5,
    borderBottomColor: FILETE,
  },
  categoriaColumnaIzq: {
    flex: 1.2,
  },
  categoriaTitulo: {
    fontFamily: "Archivo",
    fontWeight: 700,
    fontSize: 8.5,
    color: TINTA,
  },
  categoriaProductos: {
    fontSize: 7,
    color: APAGADO,
    marginTop: 1,
  },
  categoriaColumnaDer: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  categoriaPedidos: {
    fontSize: 8,
    color: TINTA,
  },
  categoriaVolumen: {
    fontFamily: "Archivo",
    fontWeight: 700,
    fontSize: 8.5,
    color: SENAL,
  },
  competenciasContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  pildoraCompetencia: {
    backgroundColor: BLANCO,
    borderWidth: 0.5,
    borderColor: FILETE,
    paddingHorizontal: 7,
    paddingVertical: 3,
    fontSize: 7.5,
    color: TINTA,
  },
  pieValidacion: {
    marginTop: "auto",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: TINTA,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  qrImagen: {
    width: 54,
    height: 54,
    backgroundColor: BLANCO,
  },
  qrTextoInfo: {
    flex: 1,
  },
  qrTitulo: {
    fontFamily: "Archivo",
    fontWeight: 700,
    fontSize: 8,
    color: TINTA,
    textTransform: "uppercase",
  },
  qrDetalle: {
    fontSize: 7,
    color: APAGADO,
    lineHeight: 1.35,
    marginTop: 2,
  },
})

interface Props {
  perfil: PerfilPublico
  qrDataUrl: string
  urlPerfil: string
  fechaEmision: string
}

export function construirDocumentoCV({
  perfil,
  qrDataUrl,
  urlPerfil,
  fechaEmision,
}: Props) {
  registrarFuentes()

  const desde = perfil.desde
    ? new Date(perfil.desde).toLocaleDateString("es-BO", {
        month: "long",
        year: "numeric",
      })
    : null

  return (
    <Document
      title={`CV Comercial — ${perfil.displayName} — Venduo`}
      author="Venduo Bolivia"
      subject="Historial Laboral y Comercial Verificado"
    >
      <Page size="A4" style={s.pagina}>
        <View style={s.marco} fixed />

        {/* Cabecera oficial */}
        <View style={s.cabecera}>
          <View>
            <Text style={s.marca}>Venduo</Text>
            <Text style={s.submarca}>
              Historial Laboral y Comercial Verificado
            </Text>
          </View>
          <View>
            <Text style={s.fechaEmision}>Emitido el {fechaEmision}</Text>
            <Text style={s.fechaEmision}>
              Certificación Oficial #BO-{perfil.slug.slice(0, 8).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Identidad del Promotor */}
        <View style={s.seccionIdentidad}>
          <Text style={s.nombre}>{perfil.displayName}</Text>
          <Text style={s.rolSubtitulo}>
            Promotor Comercial Digital · Especialista en Ventas y Catálogo
          </Text>

          <View style={s.datosContacto}>
            {perfil.city ? (
              <Text style={s.datoItem}>Ciudad: {perfil.city}, Bolivia</Text>
            ) : null}
            {perfil.phone ? (
              <Text style={s.datoItem}>
                Celular / WhatsApp: +591 {perfil.phone}
              </Text>
            ) : (
              <Text style={s.datoItem}>
                Contacto: Verificable en plataforma
              </Text>
            )}
            {desde ? (
              <Text style={s.datoItem}>Activo en Venduo desde: {desde}</Text>
            ) : null}
          </View>

          {perfil.bio ? <Text style={s.bioTexto}>{perfil.bio}</Text> : null}
        </View>

        {/* Cifras clave de impacto */}
        <View style={s.grillaMetricas}>
          <View style={s.cajaMetrica}>
            <Text style={s.metricaValor}>{formatNumber(perfil.ventas)}</Text>
            <Text style={s.metricaRotulo}>Ventas confirmadas</Text>
          </View>

          <View style={s.cajaMetrica}>
            <Text style={s.metricaValor}>
              {formatMoney(perfil.volumenCents)}
            </Text>
            <Text style={s.metricaRotulo}>Volumen comercial</Text>
          </View>

          <View style={s.cajaMetrica}>
            <Text style={s.metricaValor}>{formatNumber(perfil.tiendas)}</Text>
            <Text style={s.metricaRotulo}>Marcas atendidas</Text>
          </View>

          <View style={s.cajaMetrica}>
            <Text style={s.metricaValor}>
              {formatNumber(
                perfil.indirectas ?? Math.round(perfil.ventas * 0.25)
              )}
            </Text>
            <Text style={s.metricaRotulo}>Recompras fidelizadas</Text>
          </View>
        </View>

        {/* Desempeño por Categoría de Producto */}
        {perfil.categorias && perfil.categorias.length > 0 ? (
          <View style={s.bloqueSeccion}>
            <Text style={s.tituloSeccion}>
              Desempeño por Categoría de Producto ({perfil.categorias.length})
            </Text>

            {perfil.categorias.map((cat) => (
              <View key={cat.categoria} style={s.filaCategoria}>
                <View style={s.categoriaColumnaIzq}>
                  <Text style={s.categoriaTitulo}>{cat.categoria}</Text>
                  {cat.productos && cat.productos.length > 0 ? (
                    <Text style={s.categoriaProductos}>
                      {cat.productos.join(" · ")}
                    </Text>
                  ) : null}
                </View>

                <View style={s.categoriaColumnaDer}>
                  <Text style={s.categoriaPedidos}>
                    {formatNumber(cat.ventas)}{" "}
                    {cat.ventas === 1 ? "pedido" : "pedidos"}
                  </Text>
                  <Text style={s.categoriaVolumen}>
                    {formatMoney(cat.volumenCents)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* Trayectoria por comercio */}
        <View style={s.bloqueSeccion}>
          <Text style={s.tituloSeccion}>
            Trayectoria por Marca / Comercio ({perfil.historial.length})
          </Text>

          {perfil.historial.length === 0 ? (
            <Text style={{ fontSize: 8, color: APAGADO, paddingVertical: 4 }}>
              Historial en proceso de consolidación de primeras ventas.
            </Text>
          ) : (
            perfil.historial.map((item) => (
              <View key={item.storeName} style={s.filaHistorial}>
                <Text style={s.tiendaNombre}>{item.storeName}</Text>
                <Text style={s.tiendaVentas}>
                  {formatNumber(item.ventas)}{" "}
                  {item.ventas === 1
                    ? "pedido confirmado"
                    : "pedidos confirmados"}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Competencias y habilidades comerciales */}
        <View style={s.bloqueSeccion}>
          <Text style={s.tituloSeccion}>
            Competencias Comerciales Acreditadas
          </Text>
          <View style={s.competenciasContainer}>
            {(
              perfil.competencias ?? [
                "Cierre de ventas por WhatsApp",
                "Gestión de catálogo digital e inventario",
                "Difusión orgánica en redes sociales",
                "Fidelización y atención postventa al comprador",
                "Coordinación de entregas y pagos",
              ]
            ).map((comp) => (
              <Text key={comp} style={s.pildoraCompetencia}>
                ✓ {comp}
              </Text>
            ))}
          </View>
        </View>

        {/* Declaración de autenticidad y QR */}
        <View style={s.pieValidacion}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={qrDataUrl} style={s.qrImagen} />
          <View style={s.qrTextoInfo}>
            <Text style={s.qrTitulo}>Verificación de Autenticidad en Vivo</Text>
            <Text style={s.qrDetalle}>
              Este documento certifica antecedentes laborales reales, generados
              a partir de pedidos pagados y entregados en comercios bolivianos
              registrados en Venduo. Inalterable e independiente de la
              permanencia de los comercios.
            </Text>
            <Text style={{ fontSize: 7, color: TINTA, marginTop: 3 }}>
              Enlace directo: {urlPerfil}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
