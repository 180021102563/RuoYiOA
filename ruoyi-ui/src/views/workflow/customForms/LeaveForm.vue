<template>
  <div class="leave-form-wrapper">
    <el-form ref="formRef" :model="form" :rules="rules" :disabled="disabled"
             label-width="100px" style="max-width: 680px; margin: 0 auto;">

      <el-divider content-position="left">基本信息</el-divider>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="申请人" prop="applicant">
            <el-input v-model="form.applicant" placeholder="请输入申请人" :disabled="true" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="部门" prop="department">
            <el-input v-model="form.department" placeholder="请输入部门" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">请假信息</el-divider>

      <el-form-item label="请假类型" prop="leaveType">
        <el-radio-group v-model="form.leaveType">
          <el-radio label="annual">年假</el-radio>
          <el-radio label="personal">事假</el-radio>
          <el-radio label="sick">病假</el-radio>
          <el-radio label="marriage">婚假</el-radio>
          <el-radio label="compensatory">调休</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="开始时间" prop="startTime">
            <el-date-picker v-model="form.startTime" type="datetime"
                            placeholder="选择开始时间" value-format="yyyy-MM-dd HH:mm:ss"
                            style="width: 100%" @change="calcDays" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="结束时间" prop="endTime">
            <el-date-picker v-model="form.endTime" type="datetime"
                            placeholder="选择结束时间" value-format="yyyy-MM-dd HH:mm:ss"
                            style="width: 100%" @change="calcDays" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="请假天数" prop="days">
            <el-input-number v-model="form.days" :min="0.5" :max="30" :step="0.5"
                             :precision="1" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="紧急程度" prop="urgency">
            <el-rate v-model="form.urgency" :max="3" :texts="['普通', '紧急', '特急']"
                     show-text style="padding-top: 6px;" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="请假原因" prop="reason">
        <el-input v-model="form.reason" type="textarea" :rows="4"
                  placeholder="请详细说明请假原因" maxlength="500" show-word-limit />
      </el-form-item>

      <el-form-item label="附件">
        <el-upload
          action="#"
          :file-list="form.attachments"
          :auto-upload="false"
          :disabled="disabled">
          <el-button size="small" type="primary" icon="el-icon-upload">点击上传</el-button>
          <span slot="tip" class="el-upload__tip">支持 jpg/png/pdf 文件</span>
        </el-upload>
      </el-form-item>

      <!-- 发起流程时显示提交/取消按钮，审批时由审批操作按钮控制 -->
      <el-form-item v-if="showButtons && !disabled" style="text-align: center; margin-top: 30px;">
        <el-button type="primary" size="medium" icon="el-icon-s-promotion" @click="handleSubmit">
          提 交 申 请
        </el-button>
        <el-button size="medium" icon="el-icon-refresh-left" @click="handleCancel">
          重 置
        </el-button>
      </el-form-item>

      <!-- 审批场景提示 -->
      <el-alert v-if="!showButtons && !disabled"
                title="请填写审批意见后点击下方审批按钮（通过/拒绝/退回）完成审批"
                type="info" :closable="false" show-icon style="margin-top: 20px;" />
    </el-form>
  </div>
</template>

<script>
/**
 * 请假申请 — 自定义表单
 *
 * ============================================
 * 自定义表单组件契约（标准接口）
 * ============================================
 *
 * 【Props — 接收的入参】
 *   formData   : Object   表单初始数据（从流程变量回填，发起时为空对象）
 *   disabled   : Boolean  是否禁用（历史表单只读查看时为 true）
 *   showButtons: Boolean  是否显示内置提交/取消按钮（发起时 true，审批时 false）
 *   procInsId  : String   流程实例ID
 *   taskId     : String   任务ID
 *
 * 【Events — 向父组件发送的事件】
 *   @submit  → { formData: Object }  用户点击提交时触发
 *   @cancel  → void                  用户点击取消时触发
 *
 * 【Methods — 通过 ref 暴露给父组件的方法（审批时必须实现）】
 *   validate()   : Promise<boolean>  表单校验
 *   getFormData(): Object            获取表单数据（审批提交时调用）
 *   resetForm()  : void              重置表单
 */
export default {
  name: 'LeaveForm',
  props: {
    // 表单初始数据（从流程变量回填）
    formData: { type: Object, default: () => ({}) },
    // 是否禁用（只读）
    disabled: { type: Boolean, default: false },
    // 是否显示提交/取消按钮（发起流程为 true，审批时为 false）
    showButtons: { type: Boolean, default: false },
    // 流程实例ID
    procInsId: { type: String, default: '' },
    // 任务ID
    taskId: { type: String, default: '' }
  },
  data() {
    return {
      form: {
        applicant: this.formData.applicant || '',
        department: this.formData.department || '',
        leaveType: this.formData.leaveType || '',
        startTime: this.formData.startTime || '',
        endTime: this.formData.endTime || '',
        days: this.formData.days || undefined,
        urgency: this.formData.urgency || 1,
        reason: this.formData.reason || '',
        attachments: this.formData.attachments || []
      },
      rules: {
        applicant: [{ required: true, message: '请输入申请人', trigger: 'blur' }],
        department: [{ required: true, message: '请输入部门', trigger: 'blur' }],
        leaveType: [{ required: true, message: '请选择请假类型', trigger: 'change' }],
        startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
        endTime: [
          { required: true, message: '请选择结束时间', trigger: 'change' },
          { validator: this.validateEndTime, trigger: 'change' }
        ],
        days: [{ required: true, message: '请输入请假天数', trigger: 'blur' }],
        reason: [
          { required: true, message: '请输入请假原因', trigger: 'blur' },
          { min: 5, message: '请假原因不少于5个字', trigger: 'blur' }
        ]
      }
    }
  },
  methods: {
    // ========== 事件处理 ==========

    handleSubmit() {
      this.$refs.formRef.validate(valid => {
        if (valid) {
          this.$emit('submit', { formData: { ...this.form } })
        }
      })
    },
    handleCancel() {
      this.$refs.formRef.resetFields()
      this.$emit('cancel')
    },

    // ========== 自定义校验 ==========

    validateEndTime(rule, value, callback) {
      if (this.form.startTime && value) {
        if (new Date(value) <= new Date(this.form.startTime)) {
          callback(new Error('结束时间必须大于开始时间'))
        } else {
          callback()
        }
      } else {
        callback()
      }
    },
    calcDays() {
      if (this.form.startTime && this.form.endTime) {
        const start = new Date(this.form.startTime)
        const end = new Date(this.form.endTime)
        const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24) * 2) / 2
        if (diff > 0) {
          this.form.days = diff
        }
      }
    },

    // ========== 暴露给父组件的方法（审批时调用） ==========

    /** 校验表单，返回 Promise<boolean> */
    validate() {
      return new Promise((resolve) => {
        this.$refs.formRef.validate(valid => resolve(valid))
      })
    },
    /** 获取表单数据 */
    getFormData() {
      return { ...this.form }
    },
    /** 重置表单 */
    resetForm() {
      this.$refs.formRef.resetFields()
    }
  }
}
</script>

<style lang="scss" scoped>
.leave-form-wrapper {
  padding: 10px 0;
}
.el-divider {
  margin: 16px 0 20px 0;
}
</style>
