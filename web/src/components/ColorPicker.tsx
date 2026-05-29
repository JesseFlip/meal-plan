import { useState, useRef } from 'react'
import { useSettings } from '../hooks/useSettings'
import { useTranslation } from '../hooks/useTranslation'

export function ColorPicker() {
  const { handwritingColor, updateHandwritingColor } = useSettings()
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const colorInputRef = useRef<HTMLInputElement>(null)

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateHandwritingColor(e.target.value)
  }

  const presetColors = [
    { name: 'Black', value: '#000000' },
    { name: 'Blue', value: '#1e40af' },
    { name: 'Red', value: '#b91c1c' },
    { name: 'Green', value: '#15803d' },
    { name: 'Purple', value: '#7e22ce' },
    { name: 'Orange', value: '#c2410c' },
  ]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 shadow-sm hover:bg-stone-50 transition-all"
        aria-label={t('settings.colorPicker')}
      >
        <div
          className="w-5 h-5 rounded border-2 border-stone-300"
          style={{ backgroundColor: handwritingColor }}
        />
        <span className="text-xs font-semibold text-stone-600">A</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg p-4 z-20 w-64">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-2">
                  {t('settings.textColor')}
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    ref={colorInputRef}
                    type="color"
                    value={handwritingColor}
                    onChange={handleColorChange}
                    className="w-12 h-12 rounded cursor-pointer border border-stone-300"
                  />
                  <input
                    type="text"
                    value={handwritingColor}
                    onChange={(e) => updateHandwritingColor(e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border border-stone-300 rounded font-mono"
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-2">
                  {t('settings.presets')}
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {presetColors.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => updateHandwritingColor(preset.value)}
                      className={`w-8 h-8 rounded border-2 transition-all ${
                        handwritingColor === preset.value
                          ? 'border-stone-900 scale-110'
                          : 'border-stone-300 hover:border-stone-400'
                      }`}
                      style={{ backgroundColor: preset.value }}
                      title={preset.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
