<template>
  <div class="app-container">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>发起流程</span>
      </div>
      <el-col :span="18" :offset="3">
        <div class="form-conf" v-if="formOpen">
          <!-- 拖拽表单：使用原有 Parser 组件 -->
          <parser v-if="formType === 'builder'"
                  :key="new Date().getTime()"
                  :form-conf="formConf"
                  @submit="submitBuilderForm"
                  @getData="getData" />

          <!-- 自定义表单：使用动态组件，显示内置提交按钮 -->
          <component v-else-if="formType === 'custom' && customFormComponent"
                     :is="customFormComponent"
                     :form-data="formData"
                     :show-buttons="true"
                     @submit="submitCustomForm" />
        </div>
      </el-col>
    </el-card>
  </div>
</template>

<script>
import { getProcessForm, startProcess } from '@/api/workflow/process'
import Parser from '@/utils/generator/parser'
import customFormRegistry from '@/utils/customFormRegistry'

export default {
  name: 'WorkStart',
  components: {
    Parser
  },
  data() {
    return {
      definitionId: null,
      deployId: null,
      procInsId: null,
      formOpen: false,
      formType: '',           // 'builder' | 'custom'
      formConf: {},           // 拖拽表单配置
      formData: {},           // 自定义表单初始数据
      customFormComponent: null, // 动态加载的自定义表单组件
    }
  },
  created() {
    this.initData();
  },
  methods: {
    async initData() {
      this.deployId = this.$route.params && this.$route.params.deployId;
      this.definitionId = this.$route.query && this.$route.query.definitionId;
      this.procInsId = this.$route.query && this.$route.query.procInsId;

      const res = await getProcessForm({
        definitionId: this.definitionId,
        deployId: this.deployId,
        procInsId: this.procInsId
      });

      if (res.data) {
        this.formType = res.data.formType || 'builder';
        this.formOpen = true;

        if (this.formType === 'custom') {
          // 动态加载自定义表单组件
          const componentName = res.data.componentPath; // 如 'LeaveForm'
          const loader = customFormRegistry[componentName];
          if (loader) {
            const module = await loader();
            this.customFormComponent = module.default || module;
          } else {
            this.$modal.msgError('自定义表单组件 "' + componentName + '" 未注册');
          }
          this.formData = res.data.formData || {};
        } else {
          this.formConf = res.data.formConf || {};
        }
      }
    },
    /** 接收子组件传的值（拖拽表单） */
    getData(data) {
      if (data) {
        const variables = [];
        data.fields.forEach(item => {
          let variableData = {};
          variableData.label = item.__config__.label
          // 表单值为多个选项时
          if (item.__config__.defaultValue instanceof Array) {
            const array = [];
            item.__config__.defaultValue.forEach(val => {
              array.push(val)
            })
            variableData.val = array;
          } else {
            variableData.val = item.__config__.defaultValue
          }
          variables.push(variableData)
        })
        this.variables = variables;
      }
    },
    /** 拖拽表单提交 */
    submitBuilderForm(data) {
      if (data && this.definitionId) {
        startProcess(this.definitionId, JSON.stringify(data.valData)).then(res => {
          this.$modal.msgSuccess(res.msg);
          this.$tab.closeOpenPage({ path: '/work/own' })
        })
      }
    },
    /** 自定义表单提交 */
    submitCustomForm({ formData }) {
      if (this.definitionId) {
        startProcess(this.definitionId, JSON.stringify(formData)).then(res => {
          this.$modal.msgSuccess(res.msg);
          this.$tab.closeOpenPage({ path: '/work/own' })
        })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.form-conf {
  margin: 15px auto;
  width: 80%;
  padding: 15px;
}
</style>
