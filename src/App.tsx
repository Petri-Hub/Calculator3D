import { useEffect, useRef, useState } from "react"
import Visor from "./Visor"
import Button from "./Button"
import "./Styles/reset.scss"
import "./Styles/style.scss"

interface IRelativeCursorPos {
   cursorX: number
   cursorY: number
}

interface KeyData {
   content: string
   value: string
   row?: string
   column?: string
}

interface IMouseMoveEvent {
   clientX: number
   clientY: number
}

interface IDocSizes {
   docWidth: number
   docHeight: number
}

interface ICursorPos {
   clientX: number
   clientY: number
}

interface IBorderData {
   borderTop: number
   borderBottom: number
   borderLeft: number
   borderRight: number
}

interface ICalcBorders {
   buttonBorder: IBorderData
   calcBorder: IBorderData
   gridBorder: IBorderData
   visorBorder: IBorderData
}

interface IAllElements {
   calculator: HTMLElement
   calcVisor: HTMLElement
   calcGrid: HTMLElement
   calcBtns: HTMLElement[]
}

interface IBorderRelation {
   calculator: string
   calcVisor: string
   calcGrid: string
   calcBtns: string
}

function App() {
   const [curCalculus, setCurCalculus] = useState<(string | number)[]>([])
   const [pastCalculus, setPastCalculus] = useState<(string | number)[]>([])
   const [lastPressedKey, setLastPressedKey] = useState<{ key: string, timestamp: number }>({ key: "", timestamp: Date.now() })
   const calcRef = useRef<HTMLDivElement>(null)

   useEffect(() => {
      document.addEventListener("mousemove", change3D)
      document.addEventListener("keyup", typeKey)
      change3D({ clientX: 0, clientY: 0 })
      // eslint-disable-next-line
   }, [])

   useEffect(() => doAction(lastPressedKey.key), [lastPressedKey])

   let isTimeoutOn = false
   function change3D(event: IMouseMoveEvent): void {
      if (isTimeoutOn) return

      isTimeoutOn = true
      setTimeout(() => (isTimeoutOn = false), getFPS(60))

      if (calcRef.current) {
         const allElements = getElements()
         const documentSizes = getDocumentSizes()
         const bordersRelation = getBorderRelation()
         const cursorClient = getCursorClients(event)
         const cursorPosition = getCursorMiddlePosition(documentSizes, cursorClient)
         const calculatedBorders = getAllBordersConfig(cursorPosition)

         animateElements(allElements, calculatedBorders, bordersRelation)
      }
   }

   function getFPS(desiredFPS: number): number {
      return 1000 / desiredFPS
   }

   function getBorderRelation() {
      return {
         calculator: "calcBorder",
         calcVisor: "visorBorder",
         calcGrid: "gridBorder",
         calcBtns: "buttonBorder",
      }
   }

   function animateElements(
      allElements: IAllElements,
      calculatedBorders: ICalcBorders,
      borderRelation: IBorderRelation
   ): void {
      const KEYS_TO_REVERSE_BORDER = ["calcGrid", "calcVisor"]

      Object.entries(allElements).forEach(([key, element]) => {

         const calcBorderKey = borderRelation[key as keyof IBorderRelation]
         const calculatedElBorder = calculatedBorders[calcBorderKey as keyof ICalcBorders]
         const isBorderReverse = KEYS_TO_REVERSE_BORDER.includes(key)

         isBorderReverse
            ? applyReversedBorderDataToElement(calculatedElBorder, element)
            : applyBorderDataToElement(calculatedElBorder, element)
      })
   }

   function getAllBordersConfig(cursorPosition: IRelativeCursorPos): ICalcBorders {
      const EXAGERATOR_AMOUNT = 1.75
      return {
         calcBorder: calculateBorder(cursorPosition, 15 * EXAGERATOR_AMOUNT, 0),
         buttonBorder: calculateBorder(cursorPosition, 5 * EXAGERATOR_AMOUNT, 1),
         gridBorder: calculateBorder(cursorPosition, 5 * EXAGERATOR_AMOUNT, 0),
         visorBorder: calculateBorder(cursorPosition, 5 * EXAGERATOR_AMOUNT, 0),
      }
   }

   function getElements(): IAllElements {
      const calcRefDOM = calcRef.current as HTMLDivElement

      return {
         calculator: calcRefDOM,
         calcVisor: calcRefDOM.querySelector(".calculator__visor") as HTMLElement,
         calcGrid: calcRefDOM.querySelector(".calculator__grid") as HTMLElement,
         calcBtns: Array.from(calcRefDOM.querySelectorAll(".calculator__grid__button")) as HTMLElement[],
      }
   }

   function applyBorderDataToElement(
      borderData: IBorderData,
      ...elements: HTMLElement[]
   ) {
      elements.flat(Infinity).forEach(element => {

         element.style["borderTopWidth"] = borderData["borderTop"] + "px"
         element.style["borderRightWidth"] = borderData["borderRight"] + "px"
         element.style["borderLeftWidth"] = borderData["borderLeft"] + "px"
         element.style["borderBottomWidth"] = borderData["borderBottom"] + "px"

      })
   }

   function applyReversedBorderDataToElement(
      borderData: IBorderData,
      ...elements: HTMLElement[]
   ) {
      elements.flat(Infinity).forEach(element => {

         element.style["borderTopWidth"] = borderData["borderBottom"] + "px"
         element.style["borderRightWidth"] = borderData["borderLeft"] + "px"
         element.style["borderLeftWidth"] = borderData["borderRight"] + "px"
         element.style["borderBottomWidth"] = borderData["borderTop"] + "px"
      })
   }

   function typeKey({ key }: { key: string }) {
      const desiredButton = getElements().calcBtns.find(el => el.getAttribute("data-value") === key)

      if (desiredButton) {
         const ANIMATION_DURATION = 50
         desiredButton.style["transition"] = ANIMATION_DURATION + "ms"
         desiredButton.style["scale"] = "0.95"
         setTimeout(() => desiredButton.style["scale"] = "1", ANIMATION_DURATION)
      }

      setLastPressedKey({ key: key, timestamp: Date.now() })
   }

   function doAction(key: string) {

      const isKeyNumber = isCharNumber(key)
      const isKeyOperator = isCharOperator(key)
      const isKeyEspecial = isCharEspecial(key)

      if (isKeyNumber) {
         const lastItem = getLastArrItem(curCalculus)
         const willPushAsNewItem = !lastItem || isCharOperator(lastItem)

         willPushAsNewItem
            ? pushNewCharToCalculus(key)
            : concatNumInCalculus(key)

         return
      }
      if (isKeyOperator) {
         const lastItem = getLastArrItem(curCalculus)
         const willReplaceLast = isCharOperator(lastItem)

         willReplaceLast
            ? replaceLastCalculusItem(key)
            : pushNewCharToCalculus(key)

         return
      }
      if (isKeyEspecial) {
         key === "=" && calculateAndSet()
         key === "." && concatDotIfPossible()
         key === "CE" && clearCalculus()
         key === "C" && clearLastItem()
      }
   }

   function clearLastItem(){
      const newCalculusArr = [...curCalculus].slice(0, curCalculus.length - 1)
      setCurCalculus(newCalculusArr)
   }

   function clearCalculus(){
      setCurCalculus([])
      setPastCalculus([])
   }

   function concatDotIfPossible() {
      const lastItem = getLastArrItem(curCalculus)
      const alreadyHasDot = /\./.test(String(lastItem))
      const isLastCharOperator = isCharOperator(getLastArrItem(curCalculus))

      if (!alreadyHasDot) {
         isLastCharOperator
            ? pushNewCharToCalculus('0.')
            : concatNumInCalculus('.')
      }
   }

   function calculateAndSet() {
      const escapedCalculation = escapeCalculusTrash(curCalculus)
      const polishedCalculation = getPossibleCalculation(escapedCalculation)
      let calculatedValue = null
      
      try{
         calculatedValue = eval(polishedCalculation.join(""))
      } catch(error){
         calculatedValue = "ERROR"
      }

      setCurCalculus([calculatedValue])
      setPastCalculus(curCalculus)
   }

   function escapeCalculusTrash(calculusArr: any[]){
      return calculusArr.map(item => item.toString().replace(/[^0-9.+\-*/]/gi, ""))
   }


   function getPossibleCalculation(calculusArr: any[]) {
      const operatorAmount = calculusArr.map(isCharOperator).filter(Boolean).length
      const numberAmount = calculusArr.map(isStringNumber).filter(Boolean).length
      const isOperationPossible = numberAmount === operatorAmount + 1

      return isOperationPossible
         ? polishCalculusArr(calculusArr)
         : polishCalculusArr(calculusArr.slice(0, calculusArr.length - 1))
   }

   function polishCalculusArr(calculusArray: any[]) {
      return calculusArray.map(item => {
         return isCharOperator(item)
            ? item
            : parseFloat(item)
      })
   }

   function replaceLastCalculusItem(key: string) {
      const calcLength = curCalculus.length
      const newArray = [...curCalculus.slice(0, calcLength - 1), key]

      setCurCalculus(newArray)
   }

   function concatNumInCalculus(key: string) {

      const calcArrLength = curCalculus.length
      const lastCalculusItem = getLastArrItem(curCalculus)
      const newLastItem = String(lastCalculusItem).concat(key)

      setCurCalculus(calculus => [...calculus.slice(0, calcArrLength - 1), newLastItem])
   }

   function pushNewCharToCalculus(key: string) {
      setCurCalculus(calculus => [...calculus, key])
   }

   function isCharEspecial(char: string): boolean {
      return ['CE', 'C', '=', '.'].includes(char)
   }

   function isCharNumber(char: string | number): boolean {
      return ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(char.toString())
   }

   function isCharOperator(char: string | number): boolean {
      return ['-', '+', '/', '*'].includes(char.toString())
   }

   function getLastArrItem(array: any[]): any {
      return array[array.length - 1]
   }

   function isStringNumber(string: string | number) {
      return /[0-9.]/gi.test(string.toString())
   }

   function calculateBorder(
      cursorPos: IRelativeCursorPos,
      maxSize: number,
      minSize: number
   ): IBorderData {
      return {
         borderTop: Math.max(minSize, (cursorPos.cursorY * maxSize) / 100),
         borderBottom: Math.max(minSize, (cursorPos.cursorY * -1 * maxSize) / 100),
         borderLeft: Math.max(minSize, (cursorPos.cursorX * maxSize) / 100),
         borderRight: Math.max(minSize, (cursorPos.cursorX * -1 * maxSize) / 100)
      }
   }
   function getCursorClients(event: IMouseMoveEvent) {
      return {
         clientX: event.clientX,
         clientY: event.clientY,
      }
   }

   function getCursorMiddlePosition(
      { docWidth, docHeight }: IDocSizes,
      { clientX, clientY }: ICursorPos
   ): IRelativeCursorPos {
      const cursorX = parseFloat((((docWidth / 2 - clientX) / (docWidth / 2)) * 100 * -1).toFixed(1))
      const cursorY = parseFloat((((docHeight / 2 - clientY) / (docHeight / 2)) * 100 * -1).toFixed(1))

      return { cursorX, cursorY }
   }

   function getDocumentSizes(): { docWidth: number; docHeight: number } {
      return {
         docWidth: document.body.clientWidth,
         docHeight: document.body.clientHeight,
      }
   }

   function getKeys(): KeyData[] {
      return [
         { content: "CE", value: "CE" },
         { content: "C", value: "C" },
         { content: "*", value: "*" },
         { content: "/", value: "/" },
         { content: "1", value: "1" },
         { content: "2", value: "2" },
         { content: "3", value: "3" },
         { content: "-", value: "-" },
         { content: "4", value: "4" },
         { content: "5", value: "5" },
         { content: "6", value: "6" },
         { content: "+", value: "+", row: "span 2" },
         { content: "7", value: "7" },
         { content: "8", value: "8" },
         { content: "9", value: "9" },
         { content: ".", value: "." },
         { content: "0", value: "0" },
         { content: "=", value: "=", column: "span 2" },
      ]
   }

   return (
      <div className="calculator" ref={calcRef}>
         <Visor total={pastCalculus.join(" ")} calculation={curCalculus.join(" ")} />
         <div className="calculator__grid">
            {getKeys().map(({ content, value, row, column }, index) => (
               <Button
                  key={index}
                  value={value}
                  row={row ?? ""}
                  column={column ?? ""}
                  onClick={typeKey}>
                  {content}
               </Button>
            ))}
         </div>
      </div>
   )
}

export default App
