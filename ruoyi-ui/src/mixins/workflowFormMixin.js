/**
 * 工作流自定义表单通用 Mixin
 *
 * 封装了自定义表单组件与 Flowable 引擎交互的标准逻辑：
 * 1. 数据回填 — 自动将流程变量映射到表单字段
 * 2. 表单校验 — 提供 validate() 方法供审批流程调用
 * 3. 数据提取 — 提供 getFormData() 方法供审批流程获取表单数据
 *
 * ============================================================
 * 使用方式：
 * ============================================================
 *
 * import workflowFormMixin from '@/mixins/workflowFormMixin'
 *
 * export default {
 *   mixins: [workflowFormMixin],
 *   // 只需定义 formDef — 字段定义（name + 默认值 + 校验规则）
 *   data() {
 *     return {
 *       formDef: {
 *         fieldName: {
 *           type: 'string',       // 'string' | 'number' | 'boolean' | 'array'
 *           default: '',          // 默认值
 *           required: true,       // 是否必填
 *           label: '字段名'       // 中文标签
 *         }
 *       },
 *       // 额外的组件内部状态...
 *     }
 *   },
 *   computed: {
 *     // 如需自定义校验规则，覆盖 rules()
 *   },
 *   methods: {
 *     // 如需自定义校验逻辑，覆盖 validate()
 *     // 如需自定义数据提取，覆盖 getFormData()
 *   }
 * }
 *
 * ============================================================
 * Props（由 start.vue / detail.vue 自动传入）：
 * ============================================================
 *   formData    : Object   流程变量回填数据
 *   disabled    : Boolean  是否只读
 *   showButtons : Boolean  是否显示内置提交按钮
 *   procInsId   : String   流程实例ID
 *   taskId      : String   任务ID
 *
 * ============================================================
 * Events（向父组件发送）：
 * ============================================================
 *   @submit → { formData: Object }
 *   @cancel → void
 *
 * ============================================================
 * Methods（父组件通过 ref 调用）：
 * ============================================================
 *   validate()   : Promise<boolean>
 *   getFormData(): Object
 *   resetForm()  : void
 */

export default {
  props: {
    formData: { type: Object, default: () => ({}) },
    disabled: { type: Boolean, default: false },
    showButtons: { type: Boolean, default: false },
    procInsId: { type: String, default: '' },
    taskId: { type: String, default: '' }
  },

  data() {
    return {
      // 内部表单数据（由 mapFormData 自动填充）
      _form: {}
    }
  },

  watch: {
    // 当父组件传入的 formData 变化时（如审批回填），重新映射
    formData: {
      immediate: true,
      handler(val) {
        if (val && Object.keys(val).length > 0) {
          this._form = this.mapFormData(val, this.formDef || {})
        } else {
          this._form = this.getFormDefaults()
        }
      }
    }
  },

  methods: {
    // ========== 核心方法（可覆盖） ==========

    /**
     * 将流程变量映射到表单字段
     * 子组件可覆盖此方法实现自定义映射逻辑
     * @param {Object} data 流程变量
     * @param {Object} def  formDef 字段定义
     * @returns {Object} 映射后的表单数据
     */
    mapFormData(data, def) {
      const mapped = {}
      Object.keys(def).forEach(key => {
        const fieldDef = def[key]
        // 优先使用回填数据，否则用默认值
        if (data.hasOwnProperty(key)) {
          mapped[key] = data[key]
        } else {
          mapped[key] = fieldDef.default
        }
      })
      return mapped
    },

    /**
     * 获取表单默认值
     * @returns {Object}
     */
    getFormDefaults() {
      const defaults = {}
      if (this.formDef) {
        Object.keys(this.formDef).forEach(key => {
          defaults[key] = this.formDef[key].default
        })
      }
      return defaults
    },

    // ========== 标准方法（审批流程调用） ==========

    /**
     * 校验表单
     * @returns {Promise<boolean>}
     */
    validate() {
      if (!this.$refs.formRef) {
        return Promise.resolve(true)
      }
      return new Promise((resolve) => {
        this.$refs.formRef.validate(valid => resolve(valid))
      })
    },

    /**
     * 获取表单数据（提交到流程引擎）
     * 子组件可覆盖以做数据清洗
     * @returns {Object}
     */
    getFormData() {
      return { ...this._form }
    },

    /**
     * 重置表单
     */
    resetForm() {
      this._form = this.getFormDefaults()
      if (this.$refs.formRef) {
        this.$refs.formRef.resetFields()
      }
    },

    // ========== 事件处理 ==========

    /**
     * 内置提交按钮处理（仅在 showButtons=true 时触发）
     */
    handleSubmit() {
      this.validate().then(async valid => {
        if (valid) {
          this.$emit('submit', { formData: this.getFormData() })
        }
      })
    },

    /**
     * 内置取消/重置按钮处理
     */
    handleCancel() {
      this.resetForm()
      this.$emit('cancel')
    }
  }
}
