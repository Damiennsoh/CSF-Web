'use client'

// Word export module - requires docx and file-saver packages
// Install: npm install docx file-saver

import * as docxModule from 'docx'
import { saveAs as saveAsFunction } from 'file-saver'

const docxAvailable = true

export interface ScheduleItem {
  date: string
  day: string
  event?: string
  leader: string
  word: string
  special?: string
  display_order?: number
}

export interface InstitutionDetails {
  name: string
  university: string
  location: string
  duration: string
}

export interface HalfNightScheduleItem {
  start: string
  end: string
  event: string
  isSpecial?: boolean
  isPrayer?: boolean
  leader: string
  prayerPoints?: string[]
  bibleVerses?: string[]
}

export class DocxExportService {
  static async exportSchedule(
    schedule: ScheduleItem[],
    institutionDetails: InstitutionDetails
  ): Promise<void> {
    // Extract the required components from the module
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, VerticalMergeType } = docxModule
    const saveAs = saveAsFunction

    try {
      // Create table rows
      const tableRows: any[] = []

      // Header row
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Month', bold: true })] })], shading: { fill: 'E8E8E8' } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Date', bold: true })] })], shading: { fill: 'E8E8E8' } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Day', bold: true })] })], shading: { fill: 'E8E8E8' } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Event', bold: true })] })], shading: { fill: 'E8E8E8' } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Person Leading', bold: true })] })], shading: { fill: 'E8E8E8' } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Person sharing the word', bold: true })] })], shading: { fill: 'E8E8E8' } }),
          ],
        })
      )

      // Data rows with color formatting for special text
      schedule.forEach((item, index) => {
        const currentDate = new Date(parseInt(item.date.split('/')[2]), parseInt(item.date.split('/')[1]) - 1, parseInt(item.date.split('/')[0]))
        const monthYearStr = item.date.split('/').slice(1).join('/')
        const isFirstOfMonthData = index === 0 || schedule[index - 1].date.split('/').slice(1).join('/') !== monthYearStr
        const monthName = currentDate.toLocaleString('default', { month: 'short' }).toUpperCase()

        const monthCell = new TableCell({
          children: isFirstOfMonthData ? [new Paragraph({ children: [new TextRun({ text: monthName, bold: true })] })] : [],
          verticalMerge: isFirstOfMonthData ? VerticalMergeType.RESTART : VerticalMergeType.CONTINUE,
        })

        // Determine if this row has special formatting (red text)
        const isSpecialDay = item.special === 'WEDNESDAY_STUDIES' || 
                            item.special === 'THURSDAY_FASTING' || 
                            item.special === 'LAST_FRIDAY_HALFNIGHT' ||
                            item.leader === 'BIBLE STUDIES' ||
                            item.leader === 'PRAYER & FASTING' ||
                            item.leader === 'HALF NIGHT' ||
                            item.word === 'DISCUSSION' ||
                            item.word === 'INTERCESSORY DEPARTMENT'

        const isMergedRow = item.event === "BIBLE STUDIES" || item.event === "PRAYER & FASTING" || item.event === "REVIVAL & DELIVERANCE" || item.event === "HALF NIGHT" || item.event === "Leaders' & 10PM Prayer"
        const isSentenceCaseMerge = item.event === "Leaders' & 10PM Prayer"
      
        // Create event cell with optional red color
        const hasEventText = !!item.event
        const eventParagraph = hasEventText
          ? new Paragraph({
              children: [
                new TextRun({ 
                  text: item.event || '—', 
                  color: 'FF0000', // Red color
                  bold: true,
                  allCaps: !isSentenceCaseMerge 
                })
              ]
            })
          : new Paragraph('—')

        // Create leader cell with optional red color
        const leaderParagraph = (isSpecialDay || isMergedRow)
          ? new Paragraph({
              children: [
                new TextRun({ 
                  text: item.leader || '—', 
                  color: 'FF0000', // Red color
                  bold: true,
                  allCaps: !isSentenceCaseMerge 
                })
              ]
            })
          : new Paragraph(item.leader || '—')

        // Create word cell with optional red color
        const wordParagraph = (isSpecialDay && !isMergedRow)
          ? new Paragraph({
              children: [
                new TextRun({ 
                  text: item.word || '—', 
                  color: 'FF0000', // Red color
                  bold: true 
                })
              ]
            })
          : new Paragraph(item.word || '—')

        tableRows.push(
          new TableRow({
            children: [
              monthCell,
              new TableCell({ children: [new Paragraph(item.date)] }),
              new TableCell({ children: [new Paragraph(item.day)] }),
              new TableCell({ children: [eventParagraph] }),
              new TableCell({ children: [leaderParagraph], columnSpan: isMergedRow ? 2 : 1 }),
              ...(isMergedRow ? [] : [new TableCell({ children: [wordParagraph] })]),
            ],
          })
        )
      })

      // Create the document
      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                children: [new TextRun({ text: institutionDetails.name, bold: true, size: 32 })],
              }),
              new Paragraph({
                children: [new TextRun({ text: institutionDetails.university, size: 24 })],
              }),
              new Paragraph({
                children: [new TextRun({ text: institutionDetails.location, size: 20 })],
              }),
              new Paragraph(''),
              new Table({
                rows: tableRows,
                width: { size: 100, type: WidthType.PERCENTAGE },
              }),
            ],
          },
        ],
      })

      // Export
      const blob = await Packer.toBlob(doc)
      const fileName = `${institutionDetails.name}-Schedule-${new Date().toISOString().split('T')[0]}.docx`
      saveAs(blob, fileName)
    } catch (error) {
      console.error('[DocxExport] Export failed:', error)
      throw error
    }
  }

  static async exportHalfNightSchedule(
    schedule: HalfNightScheduleItem[],
    institutionDetails: InstitutionDetails,
    date: string
  ): Promise<void> {
    // Extract the required components from the module
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel } = docxModule
    const saveAs = saveAsFunction

    try {
      // Create table rows
      const tableRows: any[] = []

      // Header row: TIME, SESSION, SCRIPTURAL REFERENCE, STEWARD
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'TIME', bold: true })] })], shading: { fill: 'E8E8E8' } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'SESSION', bold: true })] })], shading: { fill: 'E8E8E8' } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'SCRIPTURAL REFERENCE', bold: true })] })], shading: { fill: 'E8E8E8' } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'STEWARD', bold: true })] })], shading: { fill: 'E8E8E8' } }),
          ],
        })
      )

      // Data rows: TIME, SESSION, SCRIPTURAL REFERENCE, STEWARD
      schedule.forEach((item) => {
        // Format bible verses as a comma-separated list
        const bibleVersesText = item.bibleVerses && item.bibleVerses.length > 0 
          ? item.bibleVerses.join(', ')
          : '—'

        // Check if this is a special event (WORSHIP, OPENING PRAYER, etc.) for color formatting
        const isSpecialEvent = item.isSpecial || 
                              item.event.includes('WORSHIP') || 
                              item.event.includes('OPENING') || 
                              item.event.includes('CLOSING') ||
                              item.event.includes('WORD')

        // Create session cell with optional red color for special events
        const sessionParagraph = isSpecialEvent
          ? new Paragraph({
              children: [
                new TextRun({ 
                  text: item.event, 
                  color: 'FF0000', // Red color
                  bold: true,
                  allCaps: true
                })
              ]
            })
          : new Paragraph(item.event)

        // Create steward cell (leader column) - make CSF CHOIR red
        const isStewardSpecial = item.leader && (
          item.leader === 'CSF CHOIR' || 
          item.leader === 'CHOIR' ||
          item.leader === 'cSF CHOIR'
        )
        const stewardParagraph = isStewardSpecial
          ? new Paragraph({
              children: [
                new TextRun({ 
                  text: item.leader, 
                  color: 'FF0000', // Red color
                  bold: true,
                  allCaps: true
                })
              ]
            })
          : new Paragraph(item.leader || '—')

        tableRows.push(
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(`${item.start} - ${item.end}`)] }),
              new TableCell({ children: [sessionParagraph] }),
              new TableCell({ children: [new Paragraph(bibleVersesText)] }),
              new TableCell({ children: [stewardParagraph] }),
            ],
          })
        )
      })

      // Add prayer points section after the main table
      const prayerPointsSection: any[] = []
      let hasPrayerPoints = false
      
      schedule.forEach((item) => {
        if (item.prayerPoints && item.prayerPoints.length > 0) {
          hasPrayerPoints = true
          prayerPointsSection.push(
            new Paragraph({
              children: [
                new TextRun({ text: `${item.event} (${item.start} - ${item.end})`, bold: true, size: 22 }),
              ],
              spacing: { before: 200, after: 100 },
            })
          )
          
          item.prayerPoints.forEach((point, index) => {
            prayerPointsSection.push(
              new Paragraph({
                children: [
                  new TextRun({ text: `${index + 1}. ${point}`, size: 20 }),
                ],
                indent: { left: 360 },
              })
            )
          })
          
          if (item.bibleVerses && item.bibleVerses.length > 0) {
            prayerPointsSection.push(
              new Paragraph({
                children: [
                  new TextRun({ text: `Scriptural References: ${item.bibleVerses.join(', ')}`, italics: true, size: 20, color: '0066CC' }),
                ],
                indent: { left: 360 },
                spacing: { after: 200 },
              })
            )
          }
        }
      })

      // Create the document
      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                text: institutionDetails.name,
                heading: HeadingLevel.TITLE,
              }),
              new Paragraph({
                text: institutionDetails.university,
                heading: HeadingLevel.HEADING_1,
              }),
              new Paragraph({
                text: institutionDetails.location,
                heading: HeadingLevel.HEADING_2,
              }),
              new Paragraph(''),
              new Paragraph({
                text: `Half Night of Prayer - ${date}`,
                heading: HeadingLevel.HEADING_3,
              }),
              new Paragraph(''),
              new Table({
                rows: tableRows,
                width: { size: 100, type: WidthType.PERCENTAGE },
              }),
              new Paragraph(''),
              ...(hasPrayerPoints ? prayerPointsSection : []),
            ],
          },
        ],
      })

      // Export
      const blob = await Packer.toBlob(doc)
      const fileName = `${institutionDetails.name}-HalfNight-${date}.docx`
      saveAs(blob, fileName)
    } catch (error) {
      console.error('[DocxExport] Half Night export failed:', error)
      throw error
    }
  }
}
