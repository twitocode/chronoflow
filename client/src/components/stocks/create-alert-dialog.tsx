'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'

import { dialogFieldVariants, dialogFormVariants } from '#/components/motion/alerts-motion'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'

type Condition = 'above' | 'below'

interface CreateAlertDialogProps {
  symbol: string
  open: boolean
  isPending: boolean
  errorMessage?: string | null
  onOpenChange: (open: boolean) => void
  onSubmit: (input: {
    symbol: string
    condition: Condition
    targetPrice: number
  }) => void
}

export function CreateAlertDialog({
  symbol,
  open,
  isPending,
  errorMessage,
  onOpenChange,
  onSubmit,
}: CreateAlertDialogProps) {
  const [condition, setCondition] = useState<Condition>('above')
  const [targetPrice, setTargetPrice] = useState('')
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!open) {
      setCondition('above')
      setTargetPrice('')
    }
  }, [open])

  const handleSubmit = () => {
    const normalized = targetPrice
      .replace(/\s/g, '')
      .replace(/,/g, '.')
    const parsedTargetPrice = Number.parseFloat(normalized)
    if (!Number.isFinite(parsedTargetPrice) || parsedTargetPrice <= 0) {
      return
    }

    onSubmit({
      symbol,
      condition,
      targetPrice: parsedTargetPrice,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create alert for {symbol}</DialogTitle>
          <DialogDescription>
            Save a threshold and ChronoFlow will notify you when the live price crosses it.
          </DialogDescription>
        </DialogHeader>

        <motion.div
          className="grid gap-4"
          variants={reduceMotion ? undefined : dialogFormVariants}
          initial={reduceMotion ? false : 'hidden'}
          animate={reduceMotion ? undefined : open ? 'visible' : 'hidden'}
        >
          <motion.div
            className="grid gap-2"
            variants={reduceMotion ? undefined : dialogFieldVariants}
          >
            <Label htmlFor="alert-condition">Condition</Label>
            <select
              id="alert-condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value as Condition)}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="above">Above</option>
              <option value="below">Below</option>
            </select>
          </motion.div>

          <motion.div
            className="grid gap-2"
            variants={reduceMotion ? undefined : dialogFieldVariants}
          >
            <Label htmlFor="alert-price">Target price</Label>
            <Input
              id="alert-price"
              type="text"
              inputMode="decimal"
              value={targetPrice}
              onChange={(e) => {
                const v = e.target.value.replace(/\s/g, '').replace(/,/g, '.')
                if (v === '' || /^\d*\.?\d*$/.test(v)) {
                  setTargetPrice(v)
                }
              }}
              placeholder="220.50"
            />
          </motion.div>

          {errorMessage ? (
            <motion.p
              className="text-sm font-medium text-destructive"
              initial={reduceMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
            >
              {errorMessage}
            </motion.p>
          ) : null}
        </motion.div>

        <DialogFooter showCloseButton>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || targetPrice.trim() === ''}
          >
            Save alert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
